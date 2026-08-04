import Link from "next/link";
import { Heart } from "lucide-react";
import { InstagramIcon, YoutubeIcon } from "@/components/icons/social-icons";

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
                <Link href="/contact" className="transition-colors hover:text-[var(--color-primary)] font-medium text-[var(--color-primary)]">
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

          {/* Resources & Social */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
              Sosyal Medya & Kaynaklar
            </h3>
            <ul className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
              <li>
                <a
                  href="https://www.instagram.com/deuybs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-pink-600 dark:hover:text-pink-400"
                >
                  <InstagramIcon className="h-4 w-4 text-pink-500" />
                  Instagram (@deuybs)
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@deuybs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-red-600 dark:hover:text-red-400"
                >
                  <YoutubeIcon className="h-4 w-4 text-red-500" />
                  YouTube (@deuybs)
                </a>
              </li>
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
              <li>
                <Link href="/privacy" className="transition-colors hover:text-[var(--color-primary)]">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="transition-colors hover:text-[var(--color-primary)]">
                  Çerez Politikası
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
