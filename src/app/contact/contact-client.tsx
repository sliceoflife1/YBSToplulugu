"use client";

import { useState } from "react";
import { Copy, Check, Send, Mail } from "lucide-react";
import { toast } from "sonner";

interface ContactClientProps {
  email: string;
}

export default function ContactClient({ email }: ContactClientProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("E-posta adresi panoya kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <Mail className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--color-muted-foreground)]">Resmi Destek E-Postası</p>
          <p className="font-mono text-base font-bold text-[var(--color-foreground)] truncate">
            {email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
          title="E-posta Adresini Kopyala"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span>Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Kopyala</span>
            </>
          )}
        </button>

        <a
          href={`mailto:${email}`}
          className="flex items-center justify-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm"
        >
          <Send className="h-4 w-4" />
          <span>Mail Gönder</span>
        </a>
      </div>
    </div>
  );
}
