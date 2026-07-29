export interface EmailTemplateProps {
  recipientName?: string;
  actionUrl: string;
  extraData?: Record<string, any>;
}

const BASE_STYLES = `
  body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 0; -webkit-font-smoothing: antialiased; }
  .wrapper { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0; }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #b91c1c 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
  .brand-title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
  .brand-sub { margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1; font-weight: 500; opacity: 0.9; }
  .content { padding: 40px 32px; color: #334155; line-height: 1.7; font-size: 15px; }
  .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
  .badge { display: inline-block; padding: 6px 14px; background: #fef2f2; color: #991b1b; font-size: 12px; font-weight: 700; border-radius: 9999px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #fecaca; }
  .btn-container { text-align: center; margin: 32px 0; }
  .btn { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff !important; padding: 14px 36px; font-weight: 700; text-decoration: none; border-radius: 12px; font-size: 15px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35); transition: all 0.2s ease; }
  .warning-box { background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 16px; border-radius: 8px; margin-top: 28px; font-size: 13px; color: #64748b; }
  .link-alt { font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 24px; line-height: 1.5; }
  .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
`;

// 1. Şifre Sıfırlama Şablonu
export function getPasswordResetTemplate({ recipientName, actionUrl }: EmailTemplateProps): string {
  const name = recipientName || "Değerli Üyemiz";
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Şifre Sıfırlama Talebi</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">Dokuz Eylül Üniversitesi</h1>
      <p class="brand-sub">Yönetim Bilişim Sistemleri Topluluğu</p>
    </div>
    <div class="content">
      <span class="badge">Güvenlik Bildirimi</span>
      <h2 class="greeting">Merhaba ${name},</h2>
      <p>DEÜ YBS Topluluğu platform hesabınız için bir <strong>şifre sıfırlama talebi</strong> aldık.</p>
      <p>Yeni ve güvenli bir şifre oluşturarak hesabınıza erişmek için lütfen aşağıdaki düğmeye tıklayın:</p>
      
      <div class="btn-container">
        <a href="${actionUrl}" target="_blank" class="btn">Şifremi Sıfırla</a>
      </div>

      <div class="warning-box">
        <strong>⚠️ Güvenlik Uyarısı:</strong> Bu talebi siz başlatmadıysanız lütfen bu e-postayı dikkate almayınız. Mevcut şifreniz tam olarak korunmaktadır.
      </div>

      <p class="link-alt">
        Düğme çalışmıyorsa aşağıdaki adresi kopyalayıp tarayıcınızın adres çubuğuna yapıştırabilirsiniz:<br>
        <a href="${actionUrl}" style="color: #dc2626;">${actionUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2026 DEÜ YBS Topluluğu. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// 2. Hesap Doğrulama / Kayıt Onay Şablonu
export function getSignupConfirmationTemplate({ recipientName, actionUrl }: EmailTemplateProps): string {
  const name = recipientName || "Aramıza Hoş Geldin";
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Hesap Doğrulama</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">Dokuz Eylül Üniversitesi</h1>
      <p class="brand-sub">Yönetim Bilişim Sistemleri Topluluğu</p>
    </div>
    <div class="content">
      <span class="badge" style="background:#ecfdf5; color:#065f46; border-color:#a7f3d0;">Aramıza Hoş Geldin</span>
      <h2 class="greeting">Merhaba ${name}, 🎉</h2>
      <p>DEÜ YBS Topluluğu ailesine katıldığın için çok heyecanlıyız! Hesabını aktifleştirmek ve topluluk platformumuza tam erişim sağlamak için e-posta adresini doğrulaman gerekiyor.</p>
      
      <div class="btn-container">
        <a href="${actionUrl}" target="_blank" class="btn" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);">E-Posta Adresimi Doğrula</a>
      </div>

      <p class="link-alt">
        Düğmeye tıklayamıyorsanız bağlantıyı tarayıcınıza yapıştırın:<br>
        <a href="${actionUrl}" style="color: #059669;">${actionUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2026 DEÜ YBS Topluluğu. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// 3. Hızlı Giriş (Magic Link) Şablonu
export function getMagicLinkTemplate({ recipientName, actionUrl }: EmailTemplateProps): string {
  const name = recipientName || "Değerli Üyemiz";
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Hızlı Giriş Bağlantısı</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">Dokuz Eylül Üniversitesi</h1>
      <p class="brand-sub">Yönetim Bilişim Sistemleri Topluluğu</p>
    </div>
    <div class="content">
      <span class="badge" style="background:#eff6ff; color:#1e40af; border-color:#bfdbfe;">Hızlı Oturum Açma</span>
      <h2 class="greeting">Merhaba ${name},</h2>
      <p>Platformumuza tek tıkla şifresiz giriş yapabilmeniz için tek kullanımlık güvenli bağlantınız hazırlandı.</p>
      
      <div class="btn-container">
        <a href="${actionUrl}" target="_blank" class="btn" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">Sisteme Giriş Yap</a>
      </div>

      <div class="warning-box">
        Bu bağlantı güvenlik amacıyla tek kullanımlıktır ve kısa süre içerisinde geçerliliğini yitirecektir.
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2026 DEÜ YBS Topluluğu. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// 4. E-Posta Değişikliği Şablonu
export function getEmailChangeTemplate({ recipientName, actionUrl }: EmailTemplateProps): string {
  const name = recipientName || "Değerli Üyemiz";
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>E-Posta Değişikliği Doğrulaması</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">Dokuz Eylül Üniversitesi</h1>
      <p class="brand-sub">Yönetim Bilişim Sistemleri Topluluğu</p>
    </div>
    <div class="content">
      <span class="badge" style="background:#fef3c7; color:#92400e; border-color:#fde68a;">E-Posta Güncelleme</span>
      <h2 class="greeting">Merhaba ${name},</h2>
      <p>DEÜ YBS Topluluğu hesabınızın e-posta adresini değiştirme talebi aldık. Yeni e-posta adresinizi onaylamak için lütfen aşağıdaki butona tıklayın:</p>
      
      <div class="btn-container">
        <a href="${actionUrl}" target="_blank" class="btn" style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35);">Yeni E-Postayı Onayla</a>
      </div>

      <div class="warning-box">
        Bu değişikliği siz talep etmediyseniz derhal hesabınızın güvenliğini gözden geçiriniz.
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2026 DEÜ YBS Topluluğu. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// 5. Platform Davet Şablonu
export function getUserInviteTemplate({ recipientName, actionUrl }: EmailTemplateProps): string {
  const name = recipientName || "Geleceğin YBS Lideri";
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>DEÜ YBS Topluluğu Daveti</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">Dokuz Eylül Üniversitesi</h1>
      <p class="brand-sub">Yönetim Bilişim Sistemleri Topluluğu</p>
    </div>
    <div class="content">
      <span class="badge" style="background:#f3e8ff; color:#6b21a8; border-color:#e9d5ff;">Özel Davet</span>
      <h2 class="greeting">Merhaba ${name}, ✨</h2>
      <p>DEÜ YBS Topluluğu dijital platformuna katılarak etkinliklere kaydolmanız, projelerinizi paylaşmanız ve mezunlarımızla iletişim kurmanız için davet edildiniz!</p>
      
      <div class="btn-container">
        <a href="${actionUrl}" target="_blank" class="btn" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);">Daveti Kabul Et & Katıl</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2026 DEÜ YBS Topluluğu. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
  `;
}
