import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Shield, FileText, CheckCircle, ArrowRight, Mail } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni | YBS Topluluğu",
  description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında YBS Topluluğu aydınlatma metni.",
};

export default function KVKKPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
            <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">KVKK Aydınlatma Metni</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Son Güncelleme Tarihi: 25 Temmuz 2026</p>
        </div>

        {/* Content Body */}
        <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 transition-shadow hover:shadow-md">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 text-[var(--color-slate-800)] dark:text-white">
              <FileText className="w-6 h-6 text-blue-500" />
              1. Veri Sorumlusunun Kimliği
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("Kanun") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla <strong>YBS Topluluğu</strong> tarafından aşağıda açıklanan kapsamda işlenebilecektir. Topluluğumuz, üyelerimizin ve platform ziyaretçilerimizin gizliliğine, temel hak ve özgürlüklerine ve kişisel verilerinin güvenliğine azami özen göstermektedir.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 transition-shadow hover:shadow-md">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 text-[var(--color-slate-800)] dark:text-white">
              <CheckCircle className="w-6 h-6 text-green-500" />
              2. Kişisel Verilerin İşlenme Amacı
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">Toplanan kişisel verileriniz, aşağıdaki amaçlar doğrultusunda işlenmektedir:</p>
            <ul className="list-none space-y-3 mt-4 text-zinc-600 dark:text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Platform üzerindeki üyelik kayıt işlemlerinin ve profil yönetiminin gerçekleştirilmesi,</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Öğrenci, iş ve staj ilan başvurularının toplanması ve ilgili taraflara güvenle iletilmesi,</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Forum paylaşımlarının düzeninin sağlanması, şikayetlerin incelenmesi ve güvenli bir topluluk ortamı oluşturulması,</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Yasal yükümlülüklerimizin yerine getirilmesi ve olası uyuşmazlıklarda yetkili mercilere bilgi verilmesi.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 transition-shadow hover:shadow-md">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 text-[var(--color-slate-800)] dark:text-white">
              <ArrowRight className="w-6 h-6 text-purple-500" />
              3. İşlenen Verilerin Aktarımı ve Toplama Yöntemi
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 mb-4">
              Kişisel verileriniz, web sitemiz üzerinden elektronik ortamda, üyelik formları, iletişim formları ve forum paylaşımları aracılığıyla tamamen veya kısmen otomatik yollarla toplanmaktadır.
            </p>
            <p className="text-zinc-600 dark:text-zinc-300">
              Toplanan verileriniz, hizmet kalitemizi artırmak ve platformun altyapı gereksinimlerini sağlamak amacıyla yurt içinde veya yurt dışında bulunan (örn: Azure, Supabase gibi) bulut altyapı hizmeti sağlayıcılarıyla ve ilgili yasal zorunluluklar dahilinde yetkili kamu kurum ve kuruluşlarıyla paylaşılabilecektir.
            </p>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 transition-shadow hover:shadow-md">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 text-[var(--color-slate-800)] dark:text-white">
              <Shield className="w-6 h-6 text-indigo-500" />
              4. İlgili Kişinin 11. Madde Kapsamındaki Hakları
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 mb-4">Kanun'un 11. maddesi uyarınca veri sahipleri aşağıdaki haklara sahiptir:</p>
            <ul className="list-none space-y-3 text-zinc-600 dark:text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">✓</span>
                <span>Kişisel veri işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme,</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">✓</span>
                <span>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">✓</span>
                <span>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">✓</span>
                <span>Eksik veya yanlış işlenmişse düzeltilmesini isteme ve silinmesini/yok edilmesini talep etme.</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/30">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-4 text-blue-900 dark:text-blue-300">
              <Mail className="w-6 h-6" />
              Bize Ulaşın
            </h2>
            <p className="text-blue-800 dark:text-blue-200/80">
              KVKK kapsamındaki haklarınızı kullanmak veya veri politikalarımız hakkında daha fazla bilgi almak için bizimle şu adres üzerinden iletişime geçebilirsiniz:
              <br />
              <a href="mailto:ozguraka92@gmail.com" className="inline-flex items-center gap-2 mt-4 text-blue-600 dark:text-blue-400 font-bold hover:underline">
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
