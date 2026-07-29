"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  getPasswordResetTemplate,
  getSignupConfirmationTemplate,
  getMagicLinkTemplate,
} from "@/lib/email-templates";

export async function sendCustomPasswordResetEmail(targetEmail: string) {
  try {
    const cleanEmail = (targetEmail || "").trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: "Geçerli bir e-posta adresi giriniz." };
    }

    const adminSupabase = createAdminClient();

    // 1. Kullanıcının kayıtlı profilini kontrol et (edu_email veya admin_gmail ile bul)
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id, edu_email, admin_gmail, first_name, last_name")
      .or(`edu_email.eq.${cleanEmail},admin_gmail.eq.${cleanEmail}`)
      .maybeSingle();

    // Supabase auth.users tablosundaki resmi e-posta adresi
    const authEmail = profile?.edu_email || cleanEmail;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ybstoplulugu.ozgurcanaka.me";
    const recipientName = profile ? `${profile.first_name} ${profile.last_name}` : "Değerli Üyemiz";

    // 2. Güvenli sıfırlama bağlantısı üret
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: "recovery",
      email: authEmail,
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
      },
    });

    if (linkError || !linkData.properties?.action_link) {
      return {
        success: false,
        error: linkError?.message || "Bu e-posta adresiyle kayıtlı aktif bir kullanıcı bulunamadı.",
      };
    }

    const actionUrl = linkData.properties.action_link;
    const htmlContent = getPasswordResetTemplate({ recipientName, actionUrl });

    // 3. Resend API Key var ise özel HTML ile doğrudan gönder
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const { Resend } = await import("resend");
      const resend = new Resend(resendApiKey);

      const { error: resendError } = await resend.emails.send({
        from: "DEÜ YBS Topluluğu <noreply@ybstoplulugu.ozgurcanaka.me>",
        to: [cleanEmail],
        subject: "DEÜ YBS Topluluğu - Şifre Sıfırlama Talebi 🔐",
        html: htmlContent,
      });

      if (resendError) {
        console.error("Resend e-posta gönderme hatası:", resendError);
        return { success: false, error: "Resend e-posta hatası: " + resendError.message };
      }
    } else {
      // Resend API Key tanımlı değilse Supabase resetPasswordForEmail tetikle
      const { error: resetError } = await adminSupabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        console.error("Supabase resetPasswordForEmail hatası:", resetError);
        let errorMsg = resetError.message;
        if (errorMsg.includes("security purposes") || errorMsg.includes("rate limit") || errorMsg.includes("request this after")) {
          errorMsg = "Güvenlik nedeniyle ardı ardına şifre sıfırlama e-postası gönderilemez. Lütfen 15-30 saniye bekleyip tekrar deneyiniz.";
        }
        return { success: false, error: errorMsg };
      }
    }

    return {
      success: true,
      message: `${cleanEmail} adresine özel Türkçe e-posta başarıyla gönderildi.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Sunucu hatası oluştu." };
  }
}
