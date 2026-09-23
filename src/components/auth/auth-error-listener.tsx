"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { resendStudentVerificationEmail } from "@/app/actions/email-actions";

export default function AuthErrorListener() {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);
  const [inputError, setInputError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Hem query parametrelerini hem de URL hash (#) içeriğini kontrol et
    const errorCode = searchParams?.get("error_code");
    const error = searchParams?.get("error");
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    const isOtpExpired =
      errorCode === "otp_expired" ||
      error === "access_denied" ||
      hash.includes("error_code=otp_expired") ||
      hash.includes("Email+link+is+invalid+or+has+expired");

    if (isOtpExpired) {
      setIsOpen(true);

      // URL'deki çirkin hata parametrelerini ve hash'i temizle
      if (typeof window !== "undefined") {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [searchParams]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError("");

    const clean = email.trim().toLowerCase();
    if (!clean) {
      setInputError("Lütfen e-posta adresinizi giriniz.");
      return;
    }

    if (!clean.endsWith("@ogr.deu.edu.tr") && !clean.endsWith("@deu.edu.tr")) {
      setInputError(
        "Güvenlik kuralı: Doğrulama bağlantısı yalnızca @ogr.deu.edu.tr veya @deu.edu.tr adreslerine gönderilebilir."
      );
      return;
    }

    startTransition(async () => {
      const result = await resendStudentVerificationEmail(clean);
      if (result.success) {
        setSentSuccess(true);
        toast.success(result.message || "Yeni doğrulama e-postası gönderildi!");
      } else {
        const errorMsg = result.error || result.message || "E-posta gönderilirken bir hata oluştu.";
        setInputError(errorMsg);
        toast.error(errorMsg);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">
        {/* Kapat butonu */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Başlık ve İkon */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-foreground)]">
              Doğrulama Bağlantısının Süresi Doldu
            </h3>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)] leading-relaxed">
              Üniversite e-posta sunucusundaki teslim gecikmeleri nedeniyle tıkladığınız bağlantı zaman aşımına uğramış olabilir.
            </p>
          </div>
        </div>

        {sentSuccess ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center my-4 animate-scale-in">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Yeni Doğrulama E-postası Gönderildi!
            </h4>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              <strong>{email}</strong> adresinize yeni bir doğrulama bağlantısı iletilmiştir. Lütfen gelen kutunuzu kontrol ediniz.
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Tamam
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-600 dark:text-blue-400 leading-relaxed flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Güvenlik kuralımız gereğince doğrulama e-postaları <strong>yalnızca @ogr.deu.edu.tr</strong> resmi öğrenci adresinize gönderilir.
              </span>
            </div>

            <div>
              <label
                htmlFor="edu-email-input"
                className="block text-xs font-medium text-[var(--color-foreground)] mb-1.5"
              >
                DEÜ Öğrenci E-posta Adresiniz
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-muted-foreground)]" />
                <input
                  id="edu-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setInputError("");
                  }}
                  placeholder="ad.soyad@ogr.deu.edu.tr"
                  required
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-9 pr-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
              {inputError && (
                <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {inputError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-1/3 rounded-xl border border-[var(--color-border)] py-2 text-xs font-semibold text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="w-2/3 rounded-xl gradient-primary py-2 text-xs font-semibold text-white shadow-md hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {isPending ? "Gönderiliyor..." : "Yeni Doğrulama E-postası Gönder"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
