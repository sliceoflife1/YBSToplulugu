"use server";

import { createAdminClient } from "@/lib/supabase/server";

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

    // 2. Resend API Key çevresel değişkeninde var mı?
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      // 2A. Resend API Key varsa: Özel Türkçe HTML şablonumuz ile gönder
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

      const resetLink = linkData.properties.action_link;
      const recipientName = profile ? `${profile.first_name} ${profile.last_name}` : "Kullanıcımız";

      const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 40px 0; }
    .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; text-align: center; color: #ffffff; }
    .content { padding: 35px 30px; color: #334155; line-height: 1.6; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 14px 32px; font-weight: 600; text-decoration: none; border-radius: 10px; margin: 25px 0; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size:24px; font-weight:bold;">DEÜ YBS Topluluğu</h1>
    </div>
    <div class="content">
      <h2 style="color:#1e293b; margin-top:0;">Şifre Sıfırlama Talebi 🔐</h2>
      <p>Merhaba <strong>${recipientName}</strong>,</p>
      <p>Hesabınız için bir şifre sıfırlama talebi aldık. Yeni bir şifre belirlemek için aşağıdaki butona tıklayabilirsiniz:</p>
      <div style="text-align: center;">
        <a href="${resetLink}" class="btn">Yeni Şifre Oluştur</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">Bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayın. Hesabınız güvendedir ve mevcut şifreniz değişmeyecektir.</p>
      <p style="font-size: 11px; color: #94a3b8; word-break: break-all; margin-top: 20px;">
        Bağlantı butonuna tıklayamıyorsanız aşağıdaki adresi tarayıcınıza yapıştırın:<br>
        <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2026 DEÜ YBS Topluluğu. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
`;

      const { Resend } = await import("resend");
      const resend = new Resend(resendApiKey);

      const { error: resendError } = await resend.emails.send({
        from: "DEÜ YBS Topluluğu <noreply@ybstoplulugu.ozgurcanaka.me>",
        to: [cleanEmail],
        subject: "DEÜ YBS Topluluğu - Şifre Sıfırlama Talebi",
        html: htmlTemplate,
      });

      if (resendError) {
        console.error("Resend e-posta gönderme hatası:", resendError);
        return { success: false, error: "Resend e-posta hatası: " + resendError.message };
      }
    } else {
      // 2B. Resend API Key tanımlı değilse: Supabase Auth'un varsayılan e-posta servisini çağır (Gerçek authEmail ile)
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
      message: `${cleanEmail} adresine şifre sıfırlama e-postası başarıyla gönderildi.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Sunucu hatası oluştu." };
  }
}
