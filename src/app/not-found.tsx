import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl gradient-primary text-5xl font-bold text-white shadow-xl shadow-blue-500/25">
          4
        </div>
        <h1 className="text-4xl font-bold text-[var(--color-foreground)]">
          Sayfa Bulunamadı
        </h1>
        <p className="mt-3 text-lg text-[var(--color-muted-foreground)]">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <div className="mt-8 flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90"
          >
            <Home className="h-4 w-4" /> Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
