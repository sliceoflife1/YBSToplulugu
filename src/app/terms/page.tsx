import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Scale, Users, FileWarning, Copyright, Mail } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları | YBS Topluluğu",
  description: "YBS Topluluğu platformu kullanım koşulları, forum etiği ve yasal bildirimler.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6">
            <Scale className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Kullanım Koşulları</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Son Güncelleme Tarihi: 25 Temmuz 2026</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <Users className="w-6 h-6 text-orange-500" />
              1. Genel Kullanım ve Forum Etiği
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              YBS Topluluğu platformuna hoş geldiniz. Bu platform, Yönetim Bilişim Sistemleri (YBS) profesyonelleri, öğrencileri ve işverenleri bir araya getiren dijital bir ağdır. Platformun sağlıklı ve yapıcı kalabilmesi için üyelerimizin şu kurallara uyması zorunludur:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-zinc-600 dark:text-zinc-300">
              <li>Diğer üyelere karşı saygılı ve profesyonel bir dil kullanmak.</li>
              <li>Siyasi, dini veya kişisel saldırı niteliği taşıyan içerikler paylaşmamak.</li>
              <li>Forum içerisine spam (istenmeyen veya tekrarlayan mesaj) veya alakasız reklamlar göndermemek.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <FileWarning className="w-6 h-6 text-red-500" />
              2. İşveren, Şirket ve İlan Başvuruları
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              İşveren hesapları üzerinden yayımlanan staj ve iş ilanlarının güncel, gerçeğe uygun ve ayrımcılık içermeyen yapıda olması şirketlerin sorumluluğundadır. 
            </p>
            <p className="text-zinc-600 dark:text-zinc-300 mt-4">
              Öğrenciler veya adaylar ilanlara başvururken paylaştıkları portfolyo, özgeçmiş ve bilgilerin doğruluğundan bizzat sorumludur. YBS Topluluğu, işveren ile aday arasındaki iletişimin sadece bir köprüsüdür; taraflar arasındaki doğabilecek hukuki veya ticari sorunlarda bir sorumluluk üstlenmez.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <Copyright className="w-6 h-6 text-indigo-500" />
              3. Fikri Mülkiyet ve Telif Hakları
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              Site üzerinde yer alan yazılım, tasarım, arayüz, logolar ve platform tarafından üretilmiş orijinal içerikler YBS Topluluğu'na aittir. İzinsiz kopyalanamaz, çoğaltılamaz veya farklı bir projede kullanılamaz. Kullanıcıların platforma yüklediği forum metinleri, görselleri ve kod parçacıkları kendilerine ait olmakla beraber, platform bu içerikleri platform içinde yayımlama ve gösterme hakkına lisanslı şekilde sahiptir.
            </p>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <Scale className="w-6 h-6 text-slate-500" />
              4. Sorumluluk Sınırı
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              Platformumuzda kullanıcılar tarafından sağlanan veya üçüncü parti linklere yönlendirilen hiçbir bilginin mutlak doğruluğunu veya güvenilirliğini garanti etmiyoruz. Platformun kullanımından doğabilecek dolaylı, arızi veya özel hiçbir maddi/manevi zarardan YBS Topluluğu sorumlu tutulamaz.
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/10 p-8 rounded-3xl border border-orange-100 dark:border-orange-900/30">
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-4 text-orange-900 dark:text-orange-300">
              <Mail className="w-6 h-6" />
              İletişim
            </h2>
            <p className="text-orange-800 dark:text-orange-200/80">
              Bu koşullar ile ilgili sorularınız, itirazlarınız veya platform içerisindeki şikayet bildirimleriniz için bize ulaşabilirsiniz:
              <br />
              <a href="mailto:ozguraka92@gmail.com" className="inline-flex items-center gap-2 mt-4 text-orange-600 dark:text-orange-400 font-bold hover:underline">
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
