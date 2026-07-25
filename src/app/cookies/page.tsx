import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Cookie, Settings, ShieldAlert, Mail } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çerez Politikası | YBS Topluluğu",
  description: "YBS Topluluğu web platformu çerez (cookie) kullanım ilkeleri ve tercih yönetimi.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-6">
            <Cookie className="w-12 h-12 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Çerez Politikası</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Son Güncelleme Tarihi: 25 Temmuz 2026</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 hover:shadow-md transition-shadow">
            <p className="text-zinc-600 dark:text-zinc-300">
              YBS Topluluğu olarak, web sitemizden en verimli şekilde faydalanabilmeniz ve kullanıcı deneyiminizi geliştirebilmek için Çerezler (Cookies) kullanmaktayız. Çerez kullanılmasını tercih etmezseniz tarayıcınızın ayarlarından çerezleri silebilir ya da engelleyebilirsiniz; ancak bu durum sitemizin bazı özelliklerini kullanmanızı etkileyebilir.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              1. Zorunlu Oturum Çerezleri (Essential Cookies)
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              Bu çerezler, web sitemizin düzgün şekilde çalışması, güvenliğinizin sağlanması ve hesabınıza giriş yaptığınızda oturumunuzun açık kalabilmesi için kesinlikle gerekli olan çerezlerdir. Kimlik doğrulama işlemleri (Supabase üzerinden) ve güvenlik amacıyla kullanılırlar. Bu çerezler kapatılamaz.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <Cookie className="w-6 h-6 text-amber-500" />
              2. Tercih ve İşlevsellik Çerezleri
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              Dil seçimi, koyu/açık tema (Dark/Light mode) tercihi gibi geçmişte yaptığınız tercihlerin hatırlanması için kullanılır. Platformu her ziyaret ettiğinizde bu ayarları tekrar yapmanızı önler ve daha kişiselleştirilmiş bir deneyim sunar.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <Settings className="w-6 h-6 text-slate-500" />
              3. Çerez Yönetimi
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              İnternet tarayıcılarının birçoğu varsayılan olarak çerezleri otomatik olarak kabul etmeye ayarlıdır. Tarayıcı ayarlarınızı değiştirerek, çerezleri tamamen engelleyebilir, cihazınıza çerez gönderildiğinde uyarı alabilir veya sadece bazı çerezleri reddedebilirsiniz. 
            </p>
            <p className="text-zinc-600 dark:text-zinc-300 mt-4">
              <em>Not: Zorunlu oturum çerezlerini engellemeniz halinde, hesabınıza giriş yapamayabilir veya ilanlara başvuramayabilirsiniz.</em>
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-3xl border border-amber-100 dark:border-amber-900/30">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-4 text-amber-900 dark:text-amber-300">
              <Mail className="w-6 h-6" />
              Daha Fazla Bilgi
            </h2>
            <p className="text-amber-800 dark:text-amber-200/80">
              Çerez politikamız veya çerez tercihlerinizin yönetimiyle ilgili tüm soru ve bildirimleriniz için iletişim adresimiz:
              <br />
              <a href="mailto:ozguraka92@gmail.com" className="inline-flex items-center gap-2 mt-4 text-amber-600 dark:text-amber-400 font-bold hover:underline">
                <Mail className="w-4 h-4" />
                ozguraka92@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
