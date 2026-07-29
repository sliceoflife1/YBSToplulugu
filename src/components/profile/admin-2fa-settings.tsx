"use client";

import { useState } from "react";
import { ShieldCheck, QrCode, Key, Lock, CheckCircle2, AlertTriangle, Copy, Loader2, Check } from "lucide-react";
import { saveAdminGmail, setupAdminTOTP, verifyAndEnableAdminTOTP, disableAdminTOTP } from "@/app/actions/totp-actions";

interface Admin2FASettingsProps {
  initialAdminGmail?: string | null;
  initialIs2FAEnabled?: boolean;
}

export function Admin2FASettings({ initialAdminGmail, initialIs2FAEnabled }: Admin2FASettingsProps) {
  const [adminGmail, setAdminGmail] = useState(initialAdminGmail || "");
  const [is2FAEnabled, setIs2FAEnabled] = useState(!!initialIs2FAEnabled);

  const [savingGmail, setSavingGmail] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [formattedSecret, setFormattedSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSaveGmail(e?: React.MouseEvent | React.FormEvent) {
    if (e) e.preventDefault();
    if (!adminGmail || !adminGmail.trim().endsWith("@gmail.com")) {
      setMessage({ type: "error", text: "Lütfen geçerli bir @gmail.com adresi giriniz." });
      return;
    }

    setSavingGmail(true);
    setMessage(null);

    const res = await saveAdminGmail(adminGmail);
    setSavingGmail(false);

    if (!res.success) {
      setMessage({ type: "error", text: res.error || "E-posta kaydedilemedi." });
    } else {
      setMessage({ type: "success", text: res.message || "İkincil e-posta kaydedildi. Şimdi QR kod oluşturabilirsiniz!" });
    }
  }

  async function handleStartSetup() {
    setSetupLoading(true);
    setMessage(null);

    const res = await setupAdminTOTP();
    setSetupLoading(false);

    if (!res.success) {
      setMessage({ type: "error", text: res.error || "2FA başlatılamadı." });
    } else if (res.qrCodeUrl && res.secret) {
      setQrCodeUrl(res.qrCodeUrl);
      setSecretKey(res.secret);
      setFormattedSecret(res.formattedSecret || res.secret);
    }
  }

  async function handleVerify(e?: React.MouseEvent | React.FormEvent) {
    if (e) e.preventDefault();
    if (verificationCode.trim().length !== 6) {
      setMessage({ type: "error", text: "Lütfen 6 haneli doğrulama kodunu giriniz." });
      return;
    }

    setVerifyLoading(true);
    setMessage(null);

    const res = await verifyAndEnableAdminTOTP(verificationCode);
    setVerifyLoading(false);

    if (!res.success) {
      setMessage({ type: "error", text: res.error || "Doğrulama başarısız." });
    } else {
      setIs2FAEnabled(true);
      if (res.backupCodes) setBackupCodes(res.backupCodes);
      setMessage({ type: "success", text: res.message || "2FA başarıyla aktifleştirildi." });
    }
  }

  function handleCopySecret() {
    if (!secretKey) return;
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-foreground)]">
              Admin Güvenlik & 2FA Ayarları
            </h3>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Google Authenticator ve @gmail.com doğrulama zorunluluğu
            </p>
          </div>
        </div>
        <div>
          {is2FAEnabled ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> 2FA Aktif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 border border-amber-500/20">
              <AlertTriangle className="h-3.5 w-3.5" /> 2FA Henüz Kurulmadı
            </span>
          )}
        </div>
      </div>

      {/* Alert Notice */}
      {message && (
        <div
          className={`mb-4 rounded-xl border p-3.5 text-xs font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 1. Step: Admin Gmail Setup */}
      <div className="mb-6 space-y-3 border-b border-[var(--color-border)] pb-6">
        <label className="block text-xs font-semibold text-[var(--color-foreground)]">
          İkincil Admin @gmail.com Adresi <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={adminGmail}
            onChange={(e) => setAdminGmail(e.target.value)}
            placeholder="ornekadmin@gmail.com"
            required
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSaveGmail}
            disabled={savingGmail}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {savingGmail ? "Kaydediliyor..." : "Gmail Kaydet"}
          </button>
        </div>
        <p className="text-[11px] text-[var(--color-muted-foreground)]">
          * Admin rolüne sahip kullanıcılar 2FA kurulumundan sonra sisteme yalnızca tanımlı @gmail.com adresleri ile giriş yapabilirler.
        </p>
      </div>

      {/* 2. Step: Google Authenticator Setup */}
      {!is2FAEnabled ? (
        <div className="space-y-4">
          {!qrCodeUrl ? (
            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-[var(--color-border)] rounded-2xl text-center bg-[var(--color-background)]">
              <QrCode className="h-10 w-10 text-red-600 mb-2" />
              <h4 className="text-sm font-bold text-[var(--color-foreground)]">
                Google Authenticator (2FA) Kurulumunu Başlat
              </h4>
              <p className="text-xs text-[var(--color-muted-foreground)] max-w-md mt-1 mb-4">
                Telefonunuzdaki Google Authenticator uygulaması ile QR kodu taratarak 2 adımlı doğrulamanızı aktifleştirin.
              </p>
              <button
                type="button"
                onClick={handleStartSetup}
                disabled={setupLoading || !adminGmail.trim().endsWith("@gmail.com")}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 shadow-md"
              >
                {setupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                QR Kod Oluştur & Başlat
              </button>
            </div>
          ) : (
            <div className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 animate-in fade-in">
              <h4 className="text-sm font-bold text-[var(--color-foreground)] border-b border-[var(--color-border)] pb-2">
                QR Kodu Taratın veya Manuel Anahtarı Girin
              </h4>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Offline Data URI PNG Image */}
                <div className="p-2 bg-white rounded-2xl shadow-md border border-gray-200 shrink-0">
                  <img src={qrCodeUrl} alt="Google Authenticator QR Code" className="h-48 w-48 rounded-xl object-contain" />
                </div>
                <div className="space-y-3 text-xs text-[var(--color-foreground)] flex-1">
                  <div>
                    <p className="font-bold text-sm text-[var(--color-foreground)]">Adım 1: Uygulama ile Tarayın veya Anahtarı Ekleyin</p>
                    <p className="text-[var(--color-muted-foreground)] mt-1">
                      Telefonunuzdaki Google Authenticator uygulamasını açıp <strong>"+"</strong> butonuna basın:
                    </p>
                    <ul className="list-disc list-inside text-[var(--color-muted-foreground)] mt-1 space-y-0.5">
                      <li><strong>QR kodunu tarayın</strong> seçeneği ile görseli taratın.</li>
                      <li>Veya <strong>Kurulum anahtarı girin</strong> seçeneğiyle aşağıdaki anahtarı yapıştırın.</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <p className="font-semibold text-xs text-[var(--color-foreground)] mb-1">Manuel Kurulum Anahtarı (Secret Key):</p>
                    <div className="flex items-center gap-2 bg-[var(--color-background)] border border-[var(--color-border)] p-2.5 rounded-xl font-mono text-sm font-bold text-red-600 tracking-wider">
                      <span className="flex-1 select-all">{formattedSecret}</span>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="flex items-center gap-1 rounded-lg bg-red-600/10 px-2.5 py-1 text-xs font-sans text-red-600 hover:bg-red-600/20 transition-colors"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Kopyalandı" : "Kopyala"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification code container */}
              <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                <label className="block text-xs font-semibold text-[var(--color-foreground)]">
                  Adım 2: Google Authenticator'ın Ürettiği Canlı 6 Haneli Kod
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="123456"
                    className="w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-[var(--color-foreground)] focus:border-red-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifyLoading || verificationCode.length !== 6}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Doğrula ve Aktifleştir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Active 2FA Card & Backup Codes */
        <div className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[var(--color-foreground)]">
                Google Authenticator (2FA) Koruması Etkin
              </h4>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Hesabınız ikincil @gmail.com adresiniz ve 2FA kodunuz ile tam koruma altındadır.
              </p>
            </div>
          </div>

          {backupCodes.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                ⚠️ Tek Kullanımlık Kurtarma Kodlarınız (Güvenli Bir Yere Kaydedin)
              </h5>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-3">
                Telefonunuza erişemediğiniz durumlarda bu kodları kullanarak giriş yapabilirsiniz. Her kod yalnızca 1 kez geçerlidir.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs font-bold text-amber-900 dark:text-amber-200">
                {backupCodes.map((code, i) => (
                  <div key={i} className="bg-white/80 dark:bg-black/40 border border-amber-500/30 p-2 rounded text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
