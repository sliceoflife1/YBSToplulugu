# YBS Topluluğu Platformu 🚀

Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri (YBS) öğrencileri, mezunları, akademisyenleri ve kurumsal iş ortaklarını bir araya getiren modern, modüler ve yüksek performanslı bir topluluk platformudur. 

Bu döküman, projede geliştirme yapacak **Yapay Zeka (AI) kodlama asistanları** ve **geliştiriciler** için sistem mimarisini, veri tabanı şemasını ve proje kurallarını kapsamlı bir şekilde açıklamaktadır.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Frontend Framework:** Next.js 16 (App Router & Turbopack)
- **Programlama Dili:** TypeScript
- **Veritabanı & Authentication:** Supabase (PostgreSQL & GoTrue)
- **Tasarım & Stil:** Tailwind CSS v4 (Sleek dark/light theme, glassmorphism bileşenler)
- **Form Yönetimi & Doğrulama:** React Hook Form & Zod
- **Uluslararasılaştırma (i18n):** Next-intl (Türkçe ve İngilizce tam destek)
- **Sunucu & Deployment:** Vercel

---

## 🗄️ Veritabanı Mimarisi (Supabase / PostgreSQL)

Veritabanı ilişkileri ve RLS (Row Level Security) politikaları projenin güvenliği için kritik öneme sahiptir. Tabloların yapısı ve üstlendikleri roller şu şekildedir:

### 1. `profiles` (Kullanıcı Profilleri)
Her kullanıcının temel bilgilerini ve platform rollerini tutar.
- **Roller (`UserRole`):** `student` (Öğrenci), `alumni` (Mezun), `faculty` (Akademisyen), `employer` (İşveren/Kurum Temsilcisi), `admin` (Yönetici), `moderator` (Moderatör).
- **Mentörlük Alanları:** `is_mentor` (boolean), `meeting_url` (Calendly vb. randevu linki), `mentor_topics` (konu etiketleri).
- **CV Gizliliği:** `is_cv_public` (boolean) - Öğrencinin CV'sinin kurumsal firmalarca Yetenek Havuzunda görünüp görünmeyeceğini belirler.

### 2. `cv_data` (Özgeçmiş Bilgileri)
Öğrencilerin detaylı CV verilerini hibrid JSONB yapısında tutar.
- **İlişki:** `profiles.id` ile 1-1 ilişkilidir (`user_id`).
- **Alanlar:** `education` (JSONB), `experience` (JSONB), `skills` (TEXT[]), `certifications` (JSONB), `languages` (JSONB).

### 3. `projects` (Öğrenci Projeleri)
Öğrencilerin portföylerini sergilediği projelerdir.
- **İlişki:** `profiles.id` ile N-1 ilişkilidir.

### 4. `organizations` (Kurumsal İş Ortakları)
Şirketlerin, derneklerin ve vakıfların bilgilerini tutar.
- **Onay Süreci:** Kaydolan kurumlar yöneticiler tarafından onaylanana kadar `approval_status = 'pending'` konumundadır. Sadece `approval_status = 'approved'` olan kurum sahipleri (Employers) platformun ayrıcalıklarından faydalanabilir.

### 5. `opportunities` (İş, Staj ve Burs Fırsatları)
Sistem yöneticileri veya onaylı kurumlar tarafından eklenen ilanlardır.

### 6. `announcements` (Duyurular ve Etkinlikler)
Yöneticiler tarafından oluşturulan ve dashboard'da sergilenen duyuru/etkinlik içerikleridir.

### 7. Forum Yapısı (`subreddits`, `posts`, `comments`, `upvotes`)
Reddit benzeri topluluk tartışma odalarını, gönderileri, yorumları ve oy mekanizmasını yönetir.

---

## 🌟 Temel Özellikler & Sayfa Yapısı

### 1. Yetenek Havuzu (Talent Hub) — `/talent`
- **Yetkilendirme:** Sadece `admin`, `moderator` ve `approval_status = 'approved'` olan `employer` rollerine sahip kullanıcılar erişebilir. Yetkisi olmayanlar otomatik olarak `/explore` sayfasına yönlendirilir.
- **İşlevsellik:** `is_cv_public = true` olan tüm öğrencileri listeler. İsme, bölüme ve yeteneklere (skills) göre dinamik filtreleme ve arama sunar.

### 2. Mentörlük Ağı (Mentorship Calendar) — `/explore?tab=mentors`
- **Mentörlük Tanımı:** Mezunlar, akademisyenler ve yetkin öğrenciler profil düzenleme sayfasından `is_mentor = true` yaparak randevu linklerini (`meeting_url`) tanımlayabilirler.
- **İşlevsellik:** Keşfet sayfasındaki özel sekmede listelenirler. Öğrenciler "Randevu Al" butonuna tıklayarak doğrudan Calendly veya ilgili dış bağlantı üzerinden seans oluşturabilir.

### 3. Keşfet Paneli — `/explore`
- Öğrenciler, Akademisyenler, Kurumlar ve Mentörler olmak üzere 4 ana sekmeden oluşan, tüm platform üyelerini aramaya ve listelemeye yarayan modüldür.

### 4. Otomatik CV PDF Oluşturucu — `/cv`
- Öğrencinin `cv_data` tablosundaki verilerini çekerek profesyonel şablonlarda PDF çıktısı almasını sağlar.

---

## 🤖 Yapay Zeka (AI) Modelleri İçin Geliştirme Yönergeleri

Proje üzerinde yeni bir özellik eklerken veya hata ayıklarken lütfen aşağıdaki kurallara harfiyen uyun:

1. **Uluslararasılaştırma (i18n) Uyumluluğu:** 
   - Statik metinleri doğrudan component içine yazmayın. `messages/tr.json` ve `messages/en.json` dosyalarını kullanın. Component içinde `useTranslations()` hook'u ile çağırın.
   
2. **Supabase RLS ve Sunucu Bağlantıları:**
   - Server Component'lerde veritabanı işlemlerini `src/lib/supabase/server.ts` içerisindeki `createClient()` ile gerçekleştirin.
   - Client Component'lerde `src/lib/supabase/client.ts` içerisindeki `createClient()` kullanılmalıdır.
   - Veritabanı şemasında değişiklik yapıldığında mutlaka `supabase/migrations/` altında yeni bir ardışık SQL göç dosyası (Örn: `007_new_feature.sql`) oluşturun.

3. **Yetkilendirme & Güvenlik:**
   - Sayfa düzeyinde yetkilendirme yaparken sadece client-side kontrollere güvenmeyin. Server Component'lerde mutlaka Supabase üzerinden aktif kullanıcının rolünü (`profiles.role`) ve kurumsal onay durumunu kontrol edin.

4. **Tasarım Kuralları:**
   - Renk paletlerinde çiğ ana renkler yerine Tailwind'in uyumlu tonlarını (emerald, indigo, violet vb.) kullanın.
   - Form girdilerinde Zod şemaları (`src/lib/validations/`) aracılığıyla mutlaka istemci ve sunucu taraflı veri doğrulama yapın.
