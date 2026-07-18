import Link from "next/link";
import { Compass, Search, Tag, Calendar, ChevronRight, Eye } from "lucide-react";

export const dynamic = "force-dynamic";
import { createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";

interface Opportunity {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  conditions: string[] | null;
  category: string;
  brand_name: string;
  brand_logo_url: string | null;
  image_url: string | null;
  discount_code: string | null;
  external_link: string | null;
  end_date: string | null;
  is_active: boolean;
  views_count: number;
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string }>;
}) {
  const adminSupabase = createAdminClient();
  const params = await searchParams;
  const searchQuery = params.query || "";
  const selectedCategory = params.category || "";

  // Bütün aktif fırsatları oku (RLS Bypass)
  let { data: opportunities } = await adminSupabase
    .from("opportunities")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Eğer fırsatlar tablosu boşsa, auto-seed çalıştırıp örnek fırsatları veritabanına ekle
  if (!opportunities || opportunities.length === 0) {
    const seeded = await seedOpportunities();
    if (seeded) {
      opportunities = seeded.filter((opp: any) => opp.is_active);
    }
  }

  // Filtreleme (Arama ve Kategori)
  let filteredOpportunities = opportunities || [];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredOpportunities = filteredOpportunities.filter(
      (opp) =>
        opp.title.toLowerCase().includes(q) ||
        opp.brand_name.toLowerCase().includes(q) ||
        (opp.summary && opp.summary.toLowerCase().includes(q))
    );
  }
  if (selectedCategory && selectedCategory !== "all") {
    filteredOpportunities = filteredOpportunities.filter(
      (opp) => opp.category === selectedCategory
    );
  }

  const categories = [
    { value: "all", label: "Tümü" },
    { value: "education", label: "Kariyer & Eğitim" },
    { value: "entertainment", label: "Spor & Sanat" },
    { value: "food", label: "Yiyecek & İçecek" },
    { value: "travel", label: "Seyahat & Yaşam" },
    { value: "technology", label: "Teknoloji & Yazılım" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]/30">
      <Navbar />
      <main className="flex-1">
        {/* Banner / Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-16 text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl animate-fade-in">
              Öğrenci Fırsatları & Avantajları
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100 animate-fade-in-delay">
              Türkiye'de ve dünyada geçerli, sadece üniversitelilere özel indirimler, kupon kodları ve sanal öğrenci kartı kampanyaları.
            </p>
          </div>
        </div>

        {/* Arama ve Filtreleme Bölümü */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[var(--color-border)] pb-6">
            {/* Kategoriler */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.value}
                  href={`/opportunities?category=${cat.value}${
                    searchQuery ? `&query=${searchQuery}` : ""
                  }`}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.03] active:scale-[0.97] ${
                    (selectedCategory === cat.value ||
                      (cat.value === "all" && !selectedCategory))
                      ? "gradient-primary text-white shadow-md shadow-indigo-500/10"
                      : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  {cat.label}
                </Link>
              ))}
            </div>

            {/* Arama Çubuğu */}
            <form method="GET" action="/opportunities" className="relative w-full max-w-xs shrink-0">
              {selectedCategory && (
                <input type="hidden" name="category" value={selectedCategory} />
              )}
              <input
                type="text"
                name="query"
                defaultValue={searchQuery}
                placeholder="Fırsat veya marka ara..."
                className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] py-2.5 pl-10 pr-4 text-xs focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--color-muted-foreground)]" />
            </form>
          </div>

          {/* Fırsatlar Izgarası (Grid) */}
          {filteredOpportunities.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOpportunities.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Fırsat Görseli */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-muted)]">
                    {opp.image_url ? (
                      <img
                        src={opp.image_url}
                        alt={opp.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/5 to-purple-500/10">
                        <Tag className="h-10 w-10 text-[var(--color-primary)] opacity-40 animate-pulse" />
                      </div>
                    )}
                    <span className="absolute left-4 top-4 rounded-lg bg-[var(--color-card)]/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] shadow-sm">
                      {opp.category === "education" && "Kariyer & Eğitim"}
                      {opp.category === "entertainment" && "Spor & Sanat"}
                      {opp.category === "food" && "Yiyecek & İçecek"}
                      {opp.category === "travel" && "Seyahat & Yaşam"}
                      {opp.category === "technology" && "Teknoloji & Yazılım"}
                      {opp.category === "other" && "Diğer"}
                    </span>
                  </div>

                  {/* Kart Gövdesi */}
                  <div className="flex flex-1 flex-col p-5">
                    {/* Marka Adı ve Logo */}
                    <div className="flex items-center gap-2.5">
                      {opp.brand_logo_url ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-[var(--color-border)] p-0.5">
                          <img
                            src={opp.brand_logo_url}
                            alt={opp.brand_name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                          <Compass className="h-4 w-4 text-[var(--color-primary)]" />
                        </div>
                      )}
                      <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">
                        {opp.brand_name}
                      </span>
                    </div>

                    {/* Başlık ve Özet */}
                    <h3 className="mt-3 text-base font-bold text-[var(--color-foreground)] transition-colors group-hover:text-[var(--color-primary)]">
                      {opp.title}
                    </h3>
                    <p className="mt-1.5 flex-1 text-xs text-[var(--color-muted-foreground)] line-clamp-2">
                      {opp.summary}
                    </p>

                    {/* Kart Altı Detaylar */}
                    <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)]/50 pt-3 text-[10px] text-[var(--color-muted-foreground)]">
                      {opp.end_date ? (
                        <span className="flex items-center gap-1 font-medium text-amber-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(opp.end_date).toLocaleDateString("tr-TR")}
                        </span>
                      ) : (
                        <span>Süresiz</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {opp.views_count} görüntülenme
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-16 text-center shadow-sm">
              <Search className="mx-auto h-12 w-12 text-[var(--color-muted-foreground)] opacity-50" />
              <h3 className="mt-4 text-lg font-bold text-[var(--color-foreground)]">
                Aradığınız fırsat bulunamadı
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                Farklı anahtar kelimeler aramayı deneyebilir veya filtreleri temizleyebilirsiniz.
              </p>
              <Link
                href="/opportunities"
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
              >
                Filtreleri Temizle
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Fırsatlar tablosu boş olduğunda örnek fırsatları (Akbank ISIC, Digiturk, S Sport Plus)
 * veritabanına ekleyen otomatik seed fonksiyonu.
 */
async function seedOpportunities() {
  const adminSupabase = createAdminClient();

  const defaultOpportunities = [
    {
      title: "Üniversiteli Akbanklı’ya özel Ücretsiz ISIC Sanal Öğrenci Kartı",
      summary: "UNESCO onaylı, uluslararası alanda geçerli ISIC kartına Akbank Mobil kampanya koduyla ücretsiz sahip olun!",
      description: "Özel ayrıcalıklar Üniversiteli Akbanklı’da.\nSana özel fırsatlardan faydalanmak için Akbank Mobil’den Üniversiteli Akbanklı Programı’na katıl.\n\nAkbank Mobil’den alacağın sana özel kampanya kodu ile ücretsiz ISIC Sanal Öğrenci Kartı başvurunu tamamlayabilirsin. İlk yıl kart ücretinden muaf olarak ISIC Türkiye’de yer alan öğrenci kampanyalarından faydalanabilirsin.",
      conditions: [
        "Akbank Mobil Senin İçin menüsündeki Üniversiteli Akbanklı Programı’na katılım gerekir.",
        "Kampanya kodu Akbank Mobil Kampanyalar menüsündeki Üniversiteli Akbanklı Programı altındaki kampanyalar alanından alınır.",
        "Kod, bi'öğrenci fırsat sayfasında öğrencilik doğrulaması sonrası kullanılır.",
        "Kod, sanal ISIC öğrenci kartının ilk yıl ücretsiz oluşturulması için geçerlidir.",
        "Kod kişiye özeldir, devredilemez, kişi bazında düzenlenir ve başka kampanya ya da promosyonlarla birleştirilemez.",
        "Kart başvurusu, doğrulama süreçleri, kullanım, yenileme, ISIC platformundaki kampanyalar ve değişiklikler ISIC Türkiye yetkisindedir.",
        "Akbank T.A.Ş. ve ISIC Türkiye kampanya koşullarını, süresini ve kapsamını değiştirme hakkını saklı tutar.",
        "Kampanya 31 Aralık 2026 tarihine kadar geçerlidir."
      ],
      category: "education",
      brand_name: "Akbank & ISIC",
      brand_logo_url: "https://biogrenci.com/cache/images/fallback/akbank-68-133-e79a1c7583-q90.jpg",
      image_url: "https://biogrenci.com/images/kampanya/01KWVX6R2DE1TBR03P2GF2QQX1.png",
      discount_code: "AKBANKISIC",
      external_link: "https://biogrenci.com/firsat/universiteli-akbankli-ucretsiz-isic-sanal-ogrenci-karti",
      end_date: "2026-12-31T21:00:00.000Z",
      is_active: true,
    },
    {
      title: "Digiturk Yıldız Dolu Paket Öğrencilere Sadece 99 TL/Ay!",
      summary: "Süper Lig maçları, Premier Lig, Ligue 1, Formula 1 ve çok daha fazlası bu pakette!",
      description: "Digiturk'ten tüm üniversite öğrencilerine özel Yıldız Dolu paket ayda sadece 99 TL!\n\nSüper Lig, İngiltere Premier Lig, Fransa Ligue 1, Türkiye Basketbol Ligi, WTA, Formula 1, dünyaca ünlü filmler, popüler diziler ve çok daha fazlası bu pakette.\n\nCep telefonu ve tabletten beIN Connect uygulaması ile izlenilebilen bu paket için edu.tr uzantılı üniversite e-posta doğrulaması gerekmektedir.",
      conditions: [
        "Yıldız Dolu Öğrenci Kampanyası, 15.06.2026–03.08.2026 tarihleri arasında kampanyaya başvuran, Türkiye'de faaliyet gösteren yükseköğretim kurumlarında aktif öğrenci statüsünde bulunan ve .edu.tr uzantılı kurumsal e-posta adresini doğrulayabilen Kullanıcılar (“Öğrenci Kullanıcı”) için sunulmaktadır.",
        "beIN CONNECT Öğrenci Kampanyası’ndan yararlanmak isteyen veya yararlanan Öğrenci Kullanıcılar, DIGITURK’ün talep etmesi hâlinde, e-Devlet Kapısı üzerinden alınmış güncel tarihli öğrenci belgelerini ibraz etmekle yükümlüdür.",
        "Doğrulama işleminin tamamlanmaması hâlinde kampanyadan yararlanılamaz.",
        "Kampanya her bir Öğrenci Kullanıcı için bir kez kullanılabilir.",
        "Kampanya bedeli, kredi kartı ile tek seferde toplam 1.188 TL olarak tahsil edilmekte olup ödeme, kredi kartına 12 eşit taksit hâlinde aylık 99 TL olarak yansıtılacaktır.",
        "Öğrenci Kullanıcı, kampanya kapsamındaki içeriklere yalnızca cep telefonu veya tablet üzerinden erişilebilir. Smart TV veya bilgisayarla izleme yapılamaz.",
        "Kampanya, belirsiz süreli mesafeli satış sözleşmesi kapsamında 12 (on iki) ay kullanım sözü ile sunulmaktadır."
      ],
      category: "entertainment",
      brand_name: "Digiturk",
      brand_logo_url: "https://biogrenci.com/cache/images/fallback/digiturk-53-133-8e18e46e36-q90.jpg",
      image_url: "https://biogrenci.com/images/kampanya/01KWXMATM48N15XKH9E71JG2YJ.png",
      discount_code: "DIGI99",
      external_link: "https://biogrenci.com/firsat/digiturk-ogrenci-indirimi",
      end_date: "2026-08-03T21:00:00.000Z",
      is_active: true,
    },
    {
      title: "S Sport Plus Öğrencilere Yıllık Sadece 1.999TL!",
      summary: "EuroLeague, LaLiga, Serie A, NBA, UFC, MotoGP ve dünyanın önde gelen birçok spor yayını yıllık 1.999 TL!",
      description: "EuroLeague, LaLiga, Bundesliga, Serie A, NBA, UFC, ATP Masters 1000, MotoGP ve dünyanın önde gelen birçok spor organizasyonunu S Sport Plus ayrıcalığıyla ister Smart TV’den ister webten ister cepten 2.799 TL yerine 1.999 TL’ye 1 yıl izleyebilirsiniz.\n\nKodunu Nasıl Kullanabilirim?\nPromosyon kodunuzu aldıktan sonra aşağıdaki üyelik adımlarını takip ederek S Sport Plus yayınlarını izlemeye hemen başlayabilirsiniz:\n1. S Sport Plus web sitesine girip “Üye Ol” butonuna tıklayın.\n2. Üyelik bilgilerinizi tanımlayın.\n3. Herhangi bir paket seçimi yapmadan kampanya kodunu, “Promosyon Kodu” alanına girip S Sport Plus üyeliğinizi başlatın.",
      conditions: [
        "Kampanya 31 Ağustos 2026 tarihine kadar geçerlidir.",
        "Kodlar sadece www.ssportplus.com üzerinden yapılacak üyeliklerde geçerli olup App Store ve Play Store üzerinden gerçekleştirilecek S Sport Plus üyeliklerinde geçerli değildir.",
        "Kampanyada geçerli promosyon kodu bir kez kullanılabilir.",
        "Kampanya kapsamında kullanılacak promosyon kodu ile S Sport Plus’ı 1 yıl boyunca 2.799 TL yerine 1.999 TL karşılığında kullanabilirsiniz.",
        "Üyeliğinizi iptal etmediğiniz takdirde indirimli kampanya döneminin ardından S Sport Plus yıllık paket üyeliğiniz otomatik yenileme özelliğiyle takip eden dönem için güncel fiyatlar ile yenilenir.",
        "Kampanya S Sport Plus’ın devam eden diğer indirim ve kampanyaları ile birleştirilemez."
      ],
      category: "entertainment",
      brand_name: "S Sport Plus",
      brand_logo_url: "https://biogrenci.com/cache/images/fallback/s-sport-plus-40-133-06a99e1d8b-q90.jpg",
      image_url: "https://biogrenci.com/images/kampanya/01KWHXB20176AM5HRY6JZ8YZ5W.png",
      discount_code: "SSPORT1999",
      external_link: "https://biogrenci.com/firsat/ssport-plus-ogrenci-indirimi",
      end_date: "2026-08-31T21:00:00.000Z",
      is_active: true,
    }
  ];

  const { data: inserted, error } = await adminSupabase
    .from("opportunities")
    .insert(defaultOpportunities)
    .select();

  if (error) {
    console.error("Opportunities seed error:", error);
    return null;
  }

  return inserted;
}
