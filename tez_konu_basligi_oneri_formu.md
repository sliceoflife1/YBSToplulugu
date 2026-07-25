# DOKUZ EYLÜL ÜNİVERSİTESİ
## SOSYAL BİLİMLER ENSTİTÜSÜ / FEN BİLİMLERİ ENSTİTÜSÜ
### YÖNETİM BİLİŞİM SİSTEMLERİ ANABİLİM DALI
### YÜKSEK LİSANS TEZ BAŞLIĞI ÖNERİ FORMU METİN TASLAĞI

---

> **Öğrenci Bilgileri:**
> - **Öğrenci No:** 2025800990
> - **Adı Soyadı:** ÖZGÜR CAN AKA
> - **Programı:** Yönetim Bilişim Sistemleri Yüksek Lisans Programı

---

### 1. Yüksek Lisans Tez Başlığı Dili
`Türkçe`

---

### 2. Önerilen Yüksek Lisans Tez Başlığı
**Yönetim Bilişim Sistemlerinde Akademik ve Sektörel Etkileşim İçin Bütünleşik Dijital Ekosistem ve İnsan Kaynakları Ağ Platformu Tasarımı, Geliştirilmesi ve Değerlendirilmesi: YBS Topluluğu Örneği**

---

### 3. Önerilen Yüksek Lisans Tez Başlığı (Tercümesi)
**Design, Development, and Evaluation of an Integrated Digital Ecosystem and Human Resources Networking Platform for Academic and Industry Interaction in Management Information Systems: The Case of MIS Community**

---

### 4. Araştırmanın Amacı, Hedefleri ve Önemi

Bu araştırmanın temel amacı; Yönetim Bilişim Sistemleri (YBS) disiplinindeki öğrenciler, mezunlar, akademisyenler ve sektör işverenleri arasındaki iletişim ve etkileşim kopukluğunu giderecek, bütünleşik, güvenli ve ölçeklenebilir bir dijital topluluk ve insan kaynakları ekosisteminin (YBS Topluluğu) kurgulanması, yazılım mimarisinin geliştirilmesi ve sistem performansının akademik olarak değerlendirilmesidir.

Araştırmanın Özel Hedefleri:
1. Rol Tabanlı Erişim Kontrolü (RBAC) ve Supabase Row Level Security (RLS) mimarisi kullanarak; öğrenci, mezun, akademisyen, işveren ve yönetici rollerine özel dinamik yetkilendirme altyapısı kurgulamak.
2. İşveren kuruluşlar için onaylı şirket hesabı yönetimi, kategorize edilmiş iş/staj ilanı yayınlama, başvuru takip ve adaylara doğrudan mülakat/görüşme daveti gönderme modüllerini hayata geçirmek.
3. Öğrenciler ve mezunlar için dijital özgeçmiş (CV) oluşturma, dinamik yetkinlik sergileme ve KVKK uyumlu ilan başvuru süreçlerini entegre etmek.
4. Mezun takibini otomatikleştirmek amacıyla, dönem bazlı erişim denetimine sahip dijital "Mezuniyet Yıllığı" ve etkileşimli dijital andıç sistemini platforma entegre etmek.
5. 6698 Sayılı KVKK ve GDPR standartlarına tam uyumlu; metin versiyon takibi yapabilen, yasal onay verilmeden platform kullanımını kısıtlayan engelleyici yasal rıza (Legal Consent) mekanizması tasarlamak.

Araştırmanın Önemi:
Günümüzde YBS gibi multidisipliner alanlarda nitelikli insan kaynağı ile sektör ihtiyaçlarının buluşturulması kritik bir gereksinimdir. Mevcut sosyal ağlar genel bir kitleye hitap ettiğinden alan odaklı yetkinlik doğrulaması ve akademisyen yönlendirmesi sunmakta yetersiz kalmaktadır. Bu tez çalışması, sadece teorik bir yaklaşım sunmakla kalmayıp; modern web teknolojileri (Next.js 16 App Router, TypeScript, PostgreSQL/Supabase) ile çalışan, gerçek zamanlı bildirim sistemine ve yasal veri koruma altyapısına sahip tam teşekküllü bir bilişim platformu üreterek literatüre ve uygulamaya özgün bir katkı sağlamaktadır.

---

### 5. Kullanılacak Yöntem ve Teknikler

Bu çalışmada, yazılım mühendisliği ve yönetim bilişim sistemleri disiplinlerinin kesişiminde yer alan Çevik (Agile/Scrum) Yazılım Geliştirme Metodolojisi ve Sistem Geliştirme Yaşam Döngüsü (SDLC) benimsenecektir.

1. Yazılım Mimari ve Geliştirme Teknikleri:
- Ön Yüz (Frontend): Sunucu taraflı işleme (SSR) ve istemci taraflı etkileşimleri optimize eden Next.js 16 App Router mimarisi, React 19, TypeScript ve Tailwind CSS v4 kullanılarak yüksek performanslı ve responsive UI/UX bileşenleri tasarlanacaktır.
- Arka Yüz ve Veritabanı (Backend & Database): PostgreSQL tabanlı Supabase platformu üzerinden ilişkisel veritabanı şemaları kurgulanacak; saklı yordamlar (Stored Procedures), SQL Tetikleyicileri (Triggers) ve PostgREST API katmanı kullanılacaktır.
- Güvenlik ve Yetkilendirme: Veri güvenliği Row Level Security (RLS) politikaları ile veritabanı seviyesinde sıkılaştırılacak, JWT (JSON Web Token) tabanlı oturum yönetimi uygulanacaktır.

2. Veri Toplama ve Değerlendirme Yöntemleri:
- Kullanılabilirlik ve Kabul Testleri: Geliştirilen platform Dokuz Eylül Üniversitesi YBS öğrencileri, mezunları ve sektör temsilcilerinden oluşan bir örneklem gruba sunulacak; Sistem Kullanılabilirlik Ölçeği (System Usability Scale - SUS) ve Kullanıcı Kabul Testleri (UAT) ile ölçümlenecektir.
- Performans ve Güvenlik Profillemesi: W3C Core Web Vitals standartları, Lighthouse audit araçları ve otomatik güvenlik/zafiyet tarama betikleri (Security & OWASP Scanners) aracılığıyla sistemin teknik yetkinliği doğrulanaçaktır.

---

### 6. Temel Kaynaklar

1. Pressman, R. S., & Maxim, B. R. (2020). Software Engineering: A Practitioner's Approach (9th ed.). McGraw-Hill Education.
2. Laudon, K. C., & Laudon, J. P. (2022). Management Information Systems: Managing the Digital Firm (17th ed.). Pearson.
3. Stone, D. L., Deadrick, D. L., Lukaszewski, K. M., & Johnson, R. (2015). The influence of technology on the future of human resource management. Human Resource Management Review, 25(2), 216-231.
4. Next.js Documentation (2026). Next.js App Router Architecture and Server Components. Vercel Inc.
5. Supabase Documentation (2026). PostgreSQL Row Level Security (RLS) Policies and Architecture. Supabase Inc.
6. T.C. Resmi Gazete (2016). 6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK). Sayı: 29677.
7. Brooke, J. (1996). SUS-A quick and dirty usability scale. Usability Evaluation in Industry, 189(194), 4-7.
8. Somervell, J., & McCrickard D. S. (2005). Supporting usability evaluation in agile software development. ACM SE Regional Conference.

---

### 7. Tez Bir Projeye Dayanıyor mu veya / Tez Bir Firma Tarafından Destekleniyor mu?
`Hayır`

---

### 8. Destekliyorsa Proje/Firma Bilgileri

Bu tez çalışması herhangi bir özel firma veya dış fonlama kurumu tarafından finansal olarak desteklenmemekte olup; Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Anabilim Dalı bünyesinde bağımsız bir akademik yazılım geliştirme ve araştırma projesi olarak yürütülmektedir.

---

### 9. YÖK Tez Merkezinde Benzerlik Taraması
`Var`

---

### 10. Benzerlik varsa Benzerlik Olan Tezler ve Farklı Yönleri

YÖK Tez Merkezi veritabanında "İnsan Kaynakları Yönetim Sistemleri (e-HRM)", "Kariyer Portalları" ve "Mezun Takip Sistemleri" başlığı altında yayınlanmış tezler (örneğin; web tabanlı mezun izleme yazılımları veya genel kariyer portalı tasarımları) mevcuttur.

Mevcut Çalışmalardan Farklı ve Özgün Yönleri:
1. Bütünleşik Mimari: Mevcut tezlerde iş arama, mezun takibi ve topluluk iletişimi ayrı sistemler olarak ele alınmışken; bu çalışmada tüm bu fonksiyonlar tek bir bulut mimarisinde entegre edilmiştir.
2. Veritabanı Seviyesinde Güvenlik (RLS): Benzer çalışmalarda yetkilendirme sadece uygulama katmanında yapılırken, bu tezde Supabase Row Level Security (RLS) ile veritabanı seviyesinde tam veri izolasyonu ve rol güvenliği sağlanmıştır.
3. KVKK Engelleme ve Versiyonlama Modülü: Değişen yasal mevzuata dinamik uyum sağlayan ve kullanıcılara onay vermeden platform kullanımını engelleyen özgün bir "Legal Consent Engine" kurgulanmıştır.
4. Dijital Mezuniyet Yıllığı Entegrasyonu: İnsan kaynakları platformuna ek olarak öğrenci-mezun bağını koruyan dönem bazlı dijital yıllık ve onay mekanizmalı arkadaş yazısı (andıç) modülü entegre edilmiştir.
