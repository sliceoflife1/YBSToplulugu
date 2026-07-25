import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Mail, MessageSquare, ShieldAlert, Sparkles, Send, Copy, Check } from "lucide-react";
import ContactClient from "./contact-client";

export const metadata = {
  title: "İletişim & Destek | YBS Topluluğu",
  description: "Şikayet, destek talepleri ve önerilerinizi bize mail yoluyla iletebilirsiniz.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-blue-500/20">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              İletişim & Destek
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--color-muted-foreground)]">
              Platformla ilgili her türlü şikayet, destek talebi, görüş ve önerilerinizi e-posta aracılığıyla tarafımıza iletebilirsiniz.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Sol / Ana Bilgi Kartı */}
            <div className="md:col-span-2 space-y-6">
              {/* E-posta Kartı */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-lg bg-[var(--color-primary)]/10 p-2.5 text-[var(--color-primary)]">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--color-foreground)]">E-Posta İle İletişim</h2>
                    <p className="text-xs text-[var(--color-muted-foreground)]">Doğrudan e-posta gönderin</p>
                  </div>
                </div>

                <p className="text-sm text-[var(--color-muted-foreground)] mb-6 leading-relaxed">
                  Şu an için tüm talep, şikayet ve önerileriniz tek resmi iletişim kanalımız üzerinden alınmaktadır. Gönderdiğiniz iletiler ekibimiz tarafından incelenip en kısa sürede dönüş sağlanacaktır.
                </p>

                <ContactClient email="ozguraka92@gmail.com" />
              </div>

              {/* Hangi Konularda Ulaşabilirsiniz? */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
                  İletişime Geçebileceğiniz Konular
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)] mb-1">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Şikayet & Bildirim
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Platformdaki uygunsuz içerikler veya kural ihlalleri ile ilgili bildirimler.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)] mb-1">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      Teknik Destek
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Hesap erişimi, parola sıfırlama veya platformdaki teknik aksaklıklar.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)] mb-1">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      Öneri & İstekler
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Platformu geliştirmemize yardımcı olacak yeni özellik fikirleri.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)] mb-1">
                      <Send className="h-4 w-4 text-purple-500" />
                      Kurumsal İşbirlikleri
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      İşveren onayları, sponsorluk ve öğrenci topluluğu işbirlikleri.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ Kolon: Bilgilendirme */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
                <h3 className="font-semibold text-[var(--color-foreground)] mb-2">YBS Topluluğu Destek</h3>
                <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed mb-4">
                  Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri öğrencileri ve mezunları için geliştirilen topluluk platformudur.
                </p>
                <div className="rounded-lg bg-[var(--color-primary)]/10 p-3 text-xs text-[var(--color-primary)] font-medium">
                  💡 E-posta gönderirken detaylı açıklama eklemeniz daha hızlı yardımcı olmamızı sağlar.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
