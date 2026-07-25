import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Lock, Server, UserCheck, ShieldCheck, Mail } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | YBS Topluluğu",
  description: "YBS Topluluğu platformunun verilerinizi nasıl topladığı ve koruduğu hakkında gizlilik politikası.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6">
            <Lock className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Gizlilik Politikası</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Son Güncelleme Tarihi: 25 Temmuz 2026</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <UserCheck className="w-6 h-6 text-emerald-500" />
              1. Toplanan Veriler
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              YBS Topluluğu'na kayıt olurken ve platformu kullanırken tarafınızdan şu bilgileri toplamaktayız:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-zinc-600 dark:text-zinc-300">
              <li><strong>Kimlik ve İletişim:</strong> Adınız, soyadınız, e-posta adresiniz.</li>
              <li><strong>Eğitim ve Meslek:</strong> Öğrenci olduğunuz üniversite bilgisi, bölümünüz (YBS vb.), staj durumunuz, şirket bilgileri (işverenler için).</li>
              <li><strong>Sistem ve Analitik Verileri:</strong> IP adresiniz, platformdaki etkileşimleriniz (beğeniler, forum gönderileri, başvurular) ve cihazınıza ilişkin genel analitik veriler.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <Server className="w-6 h-6 text-blue-500" />
              2. 3. Taraf Servis Kullanımı (Supabase & Azure)
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              Platformumuz modern ve güvenli bir altyapı sunmak amacıyla global hizmet sağlayıcılarını kullanmaktadır:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-zinc-600 dark:text-zinc-300">
              <li><strong>Supabase:</strong> Kullanıcı kimlik doğrulama işlemleri (Authentication) ve veritabanı yönetimi güvenli bir şekilde Supabase platformu üzerinde tutulmaktadır. Parolalarınız şifrelenmiş (hashed) olarak saklanır, tarafımızca düz metin olarak görüntülenemez.</li>
              <li><strong>Microsoft Azure:</strong> Uygulamamızın barındırılması ve kimi depolama hizmetleri Azure bulut altyapısı üzerinde gerçekleşmekte olup, verileriniz yüksek güvenlik standartları çerçevesinde korunmaktadır.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <ShieldCheck className="w-6 h-6 text-purple-500" />
              3. Veri Güvenliği Önlemleri
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              Tüm verileriniz HTTPS protokolü üzerinden şifreli olarak iletilmekte olup, sisteme yetkisiz erişimi engellemek için endüstri standardı güvenlik duvarları ve token (JWT) tabanlı yetkilendirme mekanizmaları kullanıyoruz. Kötü niyetli girişimleri engellemek adına periyodik olarak sistem denetimleri yapmaktayız.
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-4 text-emerald-900 dark:text-emerald-300">
              <Mail className="w-6 h-6" />
              Gizlilik ile İlgili Sorularınız İçin
            </h2>
            <p className="text-emerald-800 dark:text-emerald-200/80">
              Verilerinizin güvenliği ile ilgili daha fazla detaya ulaşmak veya kişisel verilerinizin silinmesini talep etmek isterseniz lütfen e-posta atın:
              <br />
              <a href="mailto:ozguraka92@gmail.com" className="inline-flex items-center gap-2 mt-4 text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
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
