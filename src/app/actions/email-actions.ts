"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  getPasswordResetTemplate,
  getSignupConfirmationTemplate,
  getMagicLinkTemplate,
  getEmailChangeTemplate,
  getUserInviteTemplate,
} from "@/lib/email-templates";

// Ortak Gönderim Yardımcısı
async function sendEmailHelper({
  toEmail,
  subject,
  htmlContent,
  fallbackAuthType,
}: {
  toEmail: string;
  subject: string;
  htmlContent: string;
  fallbackAuthType: "recovery" | "magiclink";
}) {
  const cleanEmail = (toEmail || "").trim().toLowerCase();
  const adminSupabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://deuybs.org.tr";
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const { Resend } = await import("resend");
    const resend = new Resend(resendApiKey);

    const { error: resendError } = await resend.emails.send({
      from: "DEÜ YBS Topluluğu <noreply@deuybs.org.tr>",
      to: [cleanEmail],
      subject,
      html: htmlContent,
    });

    if (resendError) {
      console.error("Resend e-posta gönderme hatası:", resendError);
      return { success: false, error: "Resend hatası: " + resendError.message };
    }
  } else {
    // Resend API Key tanımlı değilse Supabase Auth'un yerel servisini tetikle
    let resetError: any = null;
    if (fallbackAuthType === "recovery") {
      const res = await adminSupabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
      });
      resetError = res.error;
    }

    if (resetError) {
      console.error("Supabase Auth e-posta hatası:", resetError);
      let errorMsg = resetError.message;
      if (errorMsg.includes("security purposes") || errorMsg.includes("rate limit") || errorMsg.includes("request this after")) {
        errorMsg = "Güvenlik nedeniyle ardı ardına e-posta gönderilemez. Lütfen 15-30 saniye bekleyip tekrar deneyiniz.";
      }
      return { success: false, error: errorMsg };
    }
  }

  return { success: true, message: `${cleanEmail} adresine e-posta başarıyla gönderildi.` };
}

// 1. Şifre Sıfırlama E-Postası
export async function sendCustomPasswordResetEmail(targetEmail: string) {
  try {
    const cleanEmail = (targetEmail || "").trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: "Geçerli e-posta giriniz." };

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id, edu_email, admin_gmail, first_name, last_name")
      .or(`edu_email.eq.${cleanEmail},admin_gmail.eq.${cleanEmail}`)
      .maybeSingle();

    const authEmail = profile?.edu_email || cleanEmail;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://deuybs.org.tr";
    const recipientName = profile ? `${profile.first_name} ${profile.last_name}` : "Değerli Üyemiz";

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: "recovery",
      email: authEmail,
      options: { redirectTo: `${siteUrl}/auth/callback?next=/reset-password` },
    });

    if (linkError || !linkData.properties) {
      return { success: false, error: linkError?.message || "Kullanıcı bulunamadı." };
    }

    const hashedToken = linkData.properties?.hashed_token;
    const actionUrl = hashedToken
      ? `${siteUrl}/auth/confirm?token_hash=${hashedToken}&type=recovery&next=/reset-password`
      : (linkData.properties?.action_link || `${siteUrl}/auth/callback?next=/reset-password`);
    const htmlContent = getPasswordResetTemplate({ recipientName, actionUrl });

    return await sendEmailHelper({
      toEmail: cleanEmail,
      subject: "DEÜ YBS Topluluğu - Şifre Sıfırlama Talebi 🔐",
      htmlContent,
      fallbackAuthType: "recovery",
    });
  } catch (err: any) {
    return { success: false, error: err.message || "Sunucu hatası." };
  }
}

// 2. Kayıt Doğrulama E-Postası (Yalnızca Üniversite .edu.tr adreslerine gönderilir)
export async function sendCustomSignupConfirmationEmail(targetEmail: string) {
  return await resendStudentVerificationEmail(targetEmail);
}

export interface ResendVerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  alreadyConfirmed?: boolean;
}

// 2.1 Doğrulama E-postasını Yeniden Gönder (Strict Security: Yalnızca .edu.tr)
export async function resendStudentVerificationEmail(targetEmail: string): Promise<ResendVerificationResponse> {
  try {
    const cleanEmail = (targetEmail || "").trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: "Lütfen geçerli bir e-posta adresi giriniz." };
    }

    // GÜVENLİK KURALI: Yalnızca DEÜ resmi e-posta alan adları kabul edilir
    const isAllowedEduDomain = cleanEmail.endsWith("@ogr.deu.edu.tr") || cleanEmail.endsWith("@deu.edu.tr");
    if (!isAllowedEduDomain) {
      return {
        success: false,
        error: "Güvenlik kuralı gereğince doğrulama e-postası yalnızca üniversitemize ait resmi (@ogr.deu.edu.tr veya @deu.edu.tr) adreslere gönderilebilir.",
      };
    }

    const adminSupabase = createAdminClient();

    // 1. Profil ve Kullanıcı tespiti
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id, first_name, last_name, edu_email")
      .eq("edu_email", cleanEmail)
      .maybeSingle();

    let authUser: any = null;

    if (profile?.id) {
      const { data: authUserRes } = await adminSupabase.auth.admin.getUserById(profile.id);
      authUser = authUserRes?.user;
    } else {
      // Profilde henüz yoksa auth.users listesinden tara
      const { data: usersData } = await adminSupabase.auth.admin.listUsers();
      authUser = usersData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
    }

    if (!authUser) {
      return {
        success: false,
        error: "Bu e-posta adresiyle sistemde kayıtlı bir kullanıcı bulunamadı. Lütfen önce kayıt olunuz.",
      };
    }

    // 2. Kullanıcı zaten doğrulanmış mı?
    if (authUser.email_confirmed_at) {
      return {
        success: false,
        alreadyConfirmed: true,
        error: "E-posta adresiniz zaten doğrulanmıştır. Giriş sayfasından oturum açabilirsiniz.",
        message: "E-posta adresiniz zaten doğrulanmıştır. Giriş sayfasından oturum açabilirsiniz.",
      };
    }

    // 3. Spam / Rate Limit Koruması (30 saniye bekleme)
    if (authUser.confirmation_sent_at) {
      const lastSentTime = new Date(authUser.confirmation_sent_at).getTime();
      const now = Date.now();
      const diffSeconds = Math.floor((now - lastSentTime) / 1000);
      if (diffSeconds < 30) {
        return {
          success: false,
          error: `Çok sık e-posta talebinde bulunuldu. Lütfen ${30 - diffSeconds} saniye bekledikten sonra tekrar deneyiniz.`,
        };
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://deuybs.org.tr";
    const recipientName = profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Aramıza Hoş Geldin"
      : (authUser.user_metadata?.first_name || "Aramıza Hoş Geldin");

    // 4. Supabase Admin API ile taze signup token'ı üret (redirect_to: /auth/callback)
    const { data: linkData, error: linkError } = await (adminSupabase.auth.admin.generateLink as any)({
      type: "signup",
      email: cleanEmail,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });

    if (linkError || !linkData.properties) {
      console.error("[resendStudentVerificationEmail] Link oluşturma hatası:", linkError);
      return { success: false, error: linkError?.message || "Doğrulama bağlantısı üretilemedi." };
    }

    const hashedToken = linkData.properties?.hashed_token;
    const actionUrl = hashedToken
      ? `${siteUrl}/auth/confirm?token_hash=${hashedToken}&type=signup`
      : (linkData.properties?.action_link || `${siteUrl}/auth/callback`);
    const htmlContent = getSignupConfirmationTemplate({ recipientName, actionUrl });

    // 5. Resend ile YALNIZCA resmi .edu.tr adresine ilet
    const sendResult = await sendEmailHelper({
      toEmail: cleanEmail,
      subject: "DEÜ YBS Topluluğu - Hesabınızı Doğrulayın 🎉",
      htmlContent,
      fallbackAuthType: "magiclink",
    });

    if (!sendResult.success) {
      return sendResult;
    }

    return {
      success: true,
      message: `${cleanEmail} adresine yeni bir doğrulama e-postası başarıyla gönderildi. Lütfen gelen kutunuzu (ve gereksiz/spam klasörünü) kontrol ediniz.`,
    };
  } catch (err: any) {
    console.error("[resendStudentVerificationEmail] Beklenmeyen hata:", err);
    return { success: false, error: err.message || "Sunucu hatası oluştu." };
  }
}

// 2.2 Kullanıcı Doğrulama Durumu Sorgulama (Giriş ve Kayıt sayfaları için)
export async function checkAccountVerificationStatus(targetEmail: string) {
  try {
    const cleanEmail = (targetEmail || "").trim().toLowerCase();
    if (!cleanEmail) return { exists: false, isConfirmed: false };

    const adminSupabase = createAdminClient();

    // 1. Profil kontrolü
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id, edu_email")
      .eq("edu_email", cleanEmail)
      .maybeSingle();

    if (!profile) {
      // auth.users'da var mı kontrol et
      const { data: usersData } = await adminSupabase.auth.admin.listUsers();
      const authUser = usersData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (!authUser) return { exists: false, isConfirmed: false };
      return { exists: true, isConfirmed: !!authUser.email_confirmed_at };
    }

    const { data: authUserRes } = await adminSupabase.auth.admin.getUserById(profile.id);
    const authUser = authUserRes?.user;

    return {
      exists: true,
      isConfirmed: !!authUser?.email_confirmed_at,
    };
  } catch (err) {
    console.error("[checkAccountVerificationStatus] Hata:", err);
    return { exists: false, isConfirmed: false };
  }
}

// 3. Hızlı Giriş (Magic Link) E-Postası
export async function sendCustomMagicLinkEmail(targetEmail: string) {
  try {
    const cleanEmail = (targetEmail || "").trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: "Geçerli e-posta giriniz." };

    const adminSupabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://deuybs.org.tr";

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: "magiclink",
      email: cleanEmail,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });

    if (linkError || !linkData.properties) {
      return { success: false, error: linkError?.message || "Giriş bağlantısı üretilemedi." };
    }

    const hashedToken = linkData.properties?.hashed_token;
    const actionUrl = hashedToken
      ? `${siteUrl}/auth/confirm?token_hash=${hashedToken}&type=magiclink`
      : (linkData.properties?.action_link || `${siteUrl}/auth/callback`);
    const htmlContent = getMagicLinkTemplate({ recipientName: "Değerli Üyemiz", actionUrl });

    return await sendEmailHelper({
      toEmail: cleanEmail,
      subject: "DEÜ YBS Topluluğu - Hızlı Giriş Bağlantınız 🚀",
      htmlContent,
      fallbackAuthType: "magiclink",
    });
  } catch (err: any) {
    return { success: false, error: err.message || "Sunucu hatası." };
  }
}
