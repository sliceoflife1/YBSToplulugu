import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <span className="text-sm font-bold text-white">Y</span>
              </div>
              <span className="text-lg font-bold">
                <span className="gradient-text">YBS</span> Topluluğu
              </span>
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Dokuz Eylül Üniversitesi öğrencileri için profesyonel ağ ve topluluk platformu.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
              Hızlı Bağlantılar
            </h3>
            <ul className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
              <li>
                <Link href="/explore" className="transition-colors hover:text-[var(--color-primary)]">
                  Öğrencileri Keşfet
                </Link>
              </li>
              <li>
                <Link href="/community" className="transition-colors hover:text-[var(--color-primary)]">
                  Topluluk Forumu
                </Link>
              </li>
              <li>
                <Link href="/contact" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--color-primary)] font-medium text-[var(--color-primary)]">
                  İletişim
                </Link>
              </li>
              <li>
                <Link href="/register" className="transition-colors hover:text-[var(--color-primary)]">
                  Kayıt Ol
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
              Kaynaklar
            </h3>
            <ul className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
              <li>
                <a
                  href="https://www.deu.edu.tr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[var(--color-primary)]"
                >
                  DEÜ Ana Sayfa
                </a>
              </li>
              <li>
                <a
                  href="https://debis.deu.edu.tr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[var(--color-primary)]"
                >
                  DEBİS
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
              Yasal
            </h3>
            <ul className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
              <li>
                <Link href="/kvkk" className="transition-colors hover:text-[var(--color-primary)]">
                  KVKK Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-[var(--color-primary)]">
                  Kullanım Koşulları
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--color-border)] pt-6 text-center">
          <p className="flex items-center justify-center gap-1 text-sm text-[var(--color-muted-foreground)]">
            © {currentYear} YBS Topluluğu. Made with
            <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
            at DEÜ
          </p>
        </div>
      </div>
    </footer>
  );
}
