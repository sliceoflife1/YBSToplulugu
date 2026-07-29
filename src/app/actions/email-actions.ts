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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ybstoplulugu.ozgurcanaka.me";
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const { Resend } = await import("resend");
    const resend = new Resend(resendApiKey);

    const { error: resendError } = await resend.emails.send({
      from: "DEÜ YBS Topluluğu <noreply@ybstoplulugu.ozgurcanaka.me>",
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ybstoplulugu.ozgurcanaka.me";
    const recipientName = profile ? `${profile.first_name} ${profile.last_name}` : "Değerli Üyemiz";

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: "recovery",
      email: authEmail,
      options: { redirectTo: `${siteUrl}/auth/callback?next=/reset-password` },
    });

    if (linkError || !linkData.properties?.action_link) {
      return { success: false, error: linkError?.message || "Kullanıcı bulunamadı." };
    }

    const actionUrl = linkData.properties.action_link;
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

// 2. Kayıt Doğrulama E-Postası
export async function sendCustomSignupConfirmationEmail(targetEmail: string) {
  try {
    const cleanEmail = (targetEmail || "").trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: "Geçerli e-posta giriniz." };

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("edu_email", cleanEmail)
      .maybeSingle();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ybstoplulugu.ozgurcanaka.me";
    const recipientName = profile ? `${profile.first_name} ${profile.last_name}` : "Aramıza Hoş Geldin";

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: "magiclink",
      email: cleanEmail,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });

    if (linkError || !linkData.properties?.action_link) {
      return { success: false, error: linkError?.message || "Doğrulama bağlantısı üretilemedi." };
    }

    const actionUrl = linkData.properties.action_link;
    const htmlContent = getSignupConfirmationTemplate({ recipientName, actionUrl });

    return await sendEmailHelper({
      toEmail: cleanEmail,
      subject: "DEÜ YBS Topluluğu - Hesabınızı Doğrulayın 🎉",
      htmlContent,
      fallbackAuthType: "magiclink",
    });
  } catch (err: any) {
    return { success: false, error: err.message || "Sunucu hatası." };
  }
}

// 3. Hızlı Giriş (Magic Link) E-Postası
export async function sendCustomMagicLinkEmail(targetEmail: string) {
  try {
    const cleanEmail = (targetEmail || "").trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: "Geçerli e-posta giriniz." };

    const adminSupabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ybstoplulugu.ozgurcanaka.me";

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: "magiclink",
      email: cleanEmail,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });

    if (linkError || !linkData.properties?.action_link) {
      return { success: false, error: linkError?.message || "Giriş bağlantısı üretilemedi." };
    }

    const actionUrl = linkData.properties.action_link;
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
