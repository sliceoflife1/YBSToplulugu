-- =====================================================
-- YBS TOPLULUGU - ANDIÇ & PROFİL KAPSAMLI TEST VERİLERİ (SEED)
-- Bu SQL betiği:
--  - Eksik olabilecek tüm veritabanı sütunlarını kontrol eder ve ekler (Self-Healing).
--  - 5 adet son derece zengin öğrenci profili ve CV verisi (cv_data) oluşturur.
--  - 3 adet DEÜ Akademisyen (Faculty) profili oluşturur.
--  - 1 adet Mezunlar Derneği Temsilcisi (alumni) ve Dernek Organizasyonu oluşturur.
--  - 1 adet İşveren Temsilcisi (employer) ve Şirket Organizasyonu oluşturur.
--  - Karşılıklı andıç yazılarını (onaylı ve onay bekleyen) ekler.
--  - MEZUNİYET YILLARI 2026 OLARAK AYARLANMIŞTIR.
-- =====================================================

-- =====================================================
-- 0. EKSİK KOLONLARIN VE TABLOLARIN UYUMLULUK KONTROLÜ (SELF-HEALING)
-- =====================================================

-- profiles tablosu eksik alanları
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_open_to_work BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- cv_data tablosu eksik alanları
ALTER TABLE public.cv_data ADD COLUMN IF NOT EXISTS template_name TEXT DEFAULT 'modern';
ALTER TABLE public.cv_data ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3B82F6';
ALTER TABLE public.cv_data ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cv_data ADD COLUMN IF NOT EXISTS "references" JSONB DEFAULT '[]'::jsonb;

-- organizations tablosu kontrolü
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('employer', 'foundation', 'association', 'other')),
  description TEXT,
  website_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 1. AUTH.USERS KAYITLARININ OLUŞTURULMASI (Şifreler: 'test1234')
-- =====================================================
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES
  -- Öğrenciler
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'ahmet.yilmaz@test.com', '$2a$10$7R9gH5sVzQJ8tM1g.b8fO.N9V2T9Wz8F7J5J/6k3zG7XQ5Z0F6.qO', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Ahmet","last_name":"Yılmaz","role":"student"}', false, 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'ayse.demir@test.com', '$2a$10$7R9gH5sVzQJ8tM1g.b8fO.N9V2T9Wz8F7J5J/6k3zG7XQ5Z0F6.qO', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Ayşe","last_name":"Demir","role":"student"}', false, 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'mehmet.kaya@test.com', '$2a$10$7R9gH5sVzQJ8tM1g.b8fO.N9V2T9Wz8F7J5J/6k3zG7XQ5Z0F6.qO', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Mehmet","last_name":"Kaya","role":"student"}', false, 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'zeynep.celik@test.com', '$2a$10$7R9gH5sVzQJ8tM1g.b8fO.N9V2T9Wz8F7J5J/6k3zG7XQ5Z0F6.qO', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Zeynep","last_name":"Çelik","role":"student"}', false, 'authenticated'),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'can.arslan@test.com', '$2a$10$7R9gH5sVzQJ8tM1g.b8fO.N9V2T9Wz8F7J5J/6k3zG7XQ5Z0F6.qO', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Can","last_name":"Arslan","role":"student"}', false, 'authenticated'),
  
  -- Akademisyenler (Faculty)
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'kemal.yilmaz@deu.edu.tr', '$2a$10$7R9gH5sVzQJ8tM1g.b8fO.N9V2T9Wz8F7J5J/6k3zG7XQ5Z0F6.qO', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Kemal","last_name":"Yılmaz","role":"faculty"}', false, 'authenticated'),
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'nesrin.sen@deu.edu.tr', '$2a$10$7R9gH5sVzQJ8tM1g.b8fO.N9V2T9Wz8F7J5J/6k3zG7XQ5Z0F6.qO', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Nesrin","last_name":"Şen","role":"faculty"}', false, 'authenticated'),
  ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'murat.demir@deu.edu.tr', '$2a$10$7R9gH5sVzQJ8tM1g.b8fO.N9V2T9Wz8F7J5J/6k3zG7XQ5Z0F6.qO', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Murat","last_name":"Demir","role":"faculty"}', false, 'authenticated'),
  
  -- Mezunlar Derneği Temsilcisi (alumni)
  ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'hakan.kaya@test.com', '$2a$10$7R9gH5sVzQJ8tM1g.b8fO.N9V2T9Wz8F7J5J/6k3zG7XQ5Z0F6.qO', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Hakan","last_name":"Kaya","role":"alumni"}', false, 'authenticated'),
  
  -- İşveren Yetkilisi (employer)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'selin.aksoy@test.com', '$2a$10$7R9gH5sVzQJ8tM1g.b8fO.N9V2T9Wz8F7J5J/6k3zG7XQ5Z0F6.qO', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Selin","last_name":"Aksoy","role":"employer"}', false, 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. PUBLIC.PROFILES TABLOSUNA TÜM DETAYLARIN EKLENMESİ / GÜNCELLENMESİ
-- =====================================================
INSERT INTO public.profiles (
  id, first_name, last_name, student_no, edu_email, personal_email, phone, 
  department, class_year, linkedin_url, github_url, bio, avatar_url, role, 
  is_active, is_cv_public, is_mentor, mentor_topics, karma_points, headline, 
  location, website_url, is_open_to_work, created_at, updated_at
)
VALUES
  -- 1. Ahmet Yılmaz (Öğrenci)
  (
    '11111111-1111-1111-1111-111111111111', 'Ahmet', 'Yılmaz', '20202209001', 'ahmet.yilmaz@ogr.deu.edu.tr', 'ahmetyilmaz.dev@gmail.com', '+90 532 123 45 67', 
    'Yönetim Bilişim Sistemleri', 4, 'https://linkedin.com/in/ahmetyilmaz-test', 'https://github.com/ahmetyilmaz-test', 
    'Yönetim Bilişim Sistemleri 4. sınıf öğrencisiyim. Web geliştirme ve yapay zeka entegrasyonları ile ilgileniyorum. Topluluğumuzda aktif rol alıyorum.', 
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&h=400&q=80', 'student', 
    true, true, true, ARRAY['React', 'Next.js', 'Kariyer Planlama']::text[], 120, 'Frontend Developer & YBS Student', 
    'İzmir, Türkiye', 'https://ahmetyilmaz.dev', true, now(), now()
  ),
  -- 2. Ayşe Demir (Öğrenci)
  (
    '22222222-2222-2222-2222-222222222222', 'Ayşe', 'Demir', '20202209002', 'ayse.demir@ogr.deu.edu.tr', 'aysedemir.data@gmail.com', '+90 543 987 65 43', 
    'Yönetim Bilişim Sistemleri', 4, 'https://linkedin.com/in/aysedemir-test', 'https://github.com/aysedemir-test', 
    'Veri analizi, iş zekası ve büyük veri teknolojileri üzerine yoğunlaşıyorum. Python ve SQL kullanarak projeler geliştiriyorum.', 
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80', 'student', 
    true, true, false, '{}'::text[], 85, 'Data Analyst Candidate', 
    'İzmir, Türkiye', 'https://aysedemir.data', true, now(), now()
  ),
  -- 3. Mehmet Kaya (Öğrenci)
  (
    '33333333-3333-3333-3333-333333333333', 'Mehmet', 'Kaya', '20202205012', 'mehmet.kaya@ogr.deu.edu.tr', 'mehmetkaya.cloud@gmail.com', '+90 555 456 78 90', 
    'Bilgisayar Mühendisliği', 4, 'https://linkedin.com/in/mehmetkaya-test', 'https://github.com/mehmetkaya-test', 
    'Bilgisayar Mühendisliği son sınıf öğrencisiyim. Backend geliştirme, Docker ve Kubernetes ile ilgileniyorum. Bulut bilişim teknolojilerini yakından takip ediyorum.', 
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80', 'student', 
    true, true, true, ARRAY['Docker', 'Java Spring Boot', 'Sistem Mimarisi']::text[], 95, 'Backend Developer & DevOps Enthusiast', 
    'Manisa, Türkiye', null, false, now(), now()
  ),
  -- 4. Zeynep Çelik (Öğrenci)
  (
    '44444444-4444-4444-4444-444444444444', 'Zeynep', 'Çelik', '20202209043', 'zeynep.celik@ogr.deu.edu.tr', 'zeynepcelik.ux@gmail.com', '+90 505 111 22 33', 
    'Yönetim Bilişim Sistemleri', 4, 'https://linkedin.com/in/zeynepcelik-test', null, 
    'YBS son sınıf öğrencisi. Kullanıcı deneyimi (UX) araştırması, UI tasarımı ve ürün yönetimi ile ilgileniyorum. Figma ve Adobe XD kullanıyorum.', 
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80', 'student', 
    true, true, false, '{}'::text[], 60, 'UI/UX Designer & Product Management Intern', 
    'İzmir, Türkiye', 'https://zeynepcelik.design', true, now(), now()
  ),
  -- 5. Can Arslan (Öğrenci)
  (
    '55555555-5555-5555-5555-555555555555', 'Can', 'Arslan', '20202207005', 'can.arslan@ogr.deu.edu.tr', 'canarslan.stat@gmail.com', '+90 544 333 44 55', 
    'İstatistik', 4, 'https://linkedin.com/in/canarslan-test', 'https://github.com/canarslan-test', 
    'İstatistik son sınıf öğrencisi. Makine öğrenimi, derin öğrenme ve R programlama üzerine çalışıyorum. Veriden anlamlı çıktılar üretmeyi seviyorum.', 
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80', 'student', 
    true, true, false, '{}'::text[], 50, 'Machine Learning Engineer Intern', 
    'İzmir, Türkiye', null, true, now(), now()
  ),
  
  -- 6. Prof. Dr. Kemal Yılmaz (Akademisyen)
  (
    '66666666-6666-6666-6666-666666666666', 'Kemal', 'Yılmaz', null, 'kemal.yilmaz@deu.edu.tr', 'kemalyilmaz@gmail.com', '+90 232 301 00 01',
    'Yönetim Bilişim Sistemleri', null, 'https://linkedin.com/in/kemalyilmaz-deu', null,
    'Yönetim Bilişim Sistemleri Bölüm Başkanı. Yapay Zeka, Karar Destek Sistemleri ve Veri Madenciliği alanlarında akademik çalışmalar yürütmektedir.',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=400&q=80', 'faculty',
    true, false, false, '{}'::text[], 500, 'Bölüm Başkanı, Prof. Dr.',
    'İzmir, Türkiye', 'https://deu.edu.tr/ybs/kemal-yilmaz', false, now(), now()
  ),
  -- 7. Doç. Dr. Nesrin Şen (Akademisyen)
  (
    '77777777-7777-7777-7777-777777777777', 'Nesrin', 'Şen', null, 'nesrin.sen@deu.edu.tr', 'nesrinsen@gmail.com', '+90 232 301 00 02',
    'Yönetim Bilişim Sistemleri', null, 'https://linkedin.com/in/nesrinsen-deu', null,
    'Sistem Analizi ve Tasarımı, Veri Tabanı Yönetim Sistemleri ve E-Ticaret konularında dersler vermektedir. YBS Topluluğu Akademik Danışmanıdır.',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80', 'faculty',
    true, false, false, '{}'::text[], 350, 'Doçent Doktor',
    'İzmir, Türkiye', 'https://deu.edu.tr/ybs/nesrin-sen', false, now(), now()
  ),
  -- 8. Dr. Öğr. Üyesi Murat Demir (Akademisyen)
  (
    '88888888-8888-8888-8888-888888888888', 'Murat', 'Demir', null, 'murat.demir@deu.edu.tr', 'muratdemir@gmail.com', '+90 232 301 00 03',
    'Yönetim Bilişim Sistemleri', null, 'https://linkedin.com/in/muratdemir-deu', 'https://github.com/muratdemir-deu',
    'Yazılım Geliştirme, Blokzincir ve Finansal Teknolojiler üzerine çalışmalar yürütmektedir. Nesneye Yönelik Programlama dersleri vermektedir.',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80', 'faculty',
    true, false, false, '{}'::text[], 280, 'Dr. Öğretim Üyesi',
    'İzmir, Türkiye', 'https://deu.edu.tr/ybs/murat-demir', false, now(), now()
  ),

  -- 9. Hakan Kaya (Mezunlar Derneği Temsilcisi - Alumni)
  (
    '99999999-9999-9999-9999-999999999999', 'Hakan', 'Kaya', null, 'hakan.kaya@test.com', 'hakankaya@ybsdernek.org', '+90 533 111 22 33',
    'Yönetim Bilişim Sistemleri', null, 'https://linkedin.com/in/hakankaya-alumni', 'https://github.com/hakankaya-alumni',
    '2018 DEÜ YBS Mezunuyum. Şu anda aktif olarak DEÜ YBS Mezunlar Derneği başkanlığını yürütmekteyim. Mezunlar ile öğrencilerimiz arasında köprü kuruyoruz.',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80', 'alumni',
    true, true, true, ARRAY['Mezun Ağı', 'Sektör Analizi']::text[], 180, 'DEÜ YBS Mezunlar Derneği Başkanı',
    'İzmir, Türkiye', 'https://deuybsdernek.org', false, now(), now()
  ),

  -- 10. Selin Aksoy (İşveren Yetkilisi - Employer)
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Selin', 'Aksoy', null, 'selin.aksoy@test.com', 'selin.aksoy@teknobilisim.com', '+90 542 555 66 77',
    null, null, 'https://linkedin.com/in/selinaksoy-hr', null,
    'TeknoBilişim A.Ş. İnsan Kaynakları Direktörüyüm. YBS ve Mühendislik öğrencilerine staj ve iş imkanları sağlamaktan mutluluk duyuyoruz.',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80', 'employer',
    true, false, false, '{}'::text[], 90, 'HR Director at TeknoBilişim A.Ş.',
    'İstanbul, Türkiye', 'https://teknobilisim.com', false, now(), now()
  )
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  student_no = EXCLUDED.student_no,
  edu_email = EXCLUDED.edu_email,
  personal_email = EXCLUDED.personal_email,
  phone = EXCLUDED.phone,
  department = EXCLUDED.department,
  class_year = EXCLUDED.class_year,
  linkedin_url = EXCLUDED.linkedin_url,
  github_url = EXCLUDED.github_url,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  is_cv_public = EXCLUDED.is_cv_public,
  is_mentor = EXCLUDED.is_mentor,
  mentor_topics = EXCLUDED.mentor_topics,
  karma_points = EXCLUDED.karma_points,
  headline = EXCLUDED.headline,
  location = EXCLUDED.location,
  website_url = EXCLUDED.website_url,
  is_open_to_work = EXCLUDED.is_open_to_work,
  updated_at = now();

-- =====================================================
-- 3. ÖĞRENCİLER İÇİN TAM DOLU ÖZGEÇMİŞ VERİSİ (CV_DATA)
-- =====================================================
INSERT INTO public.cv_data (
  user_id, education, experience, skills, certifications, languages, custom_sections, template_name, primary_color, projects, "references"
)
VALUES
  -- 1. Ahmet Yılmaz'ın CV Verisi
  (
    '11111111-1111-1111-1111-111111111111',
    '[
      {
        "school": "Dokuz Eylül Üniversitesi",
        "degree": "Lisans",
        "field": "Yönetim Bilişim Sistemleri",
        "location": "İzmir, Türkiye",
        "gpa": "3.45",
        "startDate": "2020-09-15",
        "endDate": "2026-06-15",
        "current": false
      }
    ]'::jsonb,
    '[
      {
        "company": "Ege Teknoloji A.Ş.",
        "title": "Frontend Developer Intern",
        "location": "İzmir, Türkiye",
        "description": "React ve TailwindCSS kullanılarak web uygulamalarının arayüz tasarımlarının yapılması, API entegrasyonu ve performans optimizasyonları yapıldı.",
        "startDate": "2023-06-01",
        "endDate": "2023-09-01",
        "current": false
      }
    ]'::jsonb,
    ARRAY['React', 'Next.js', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'Git']::text[],
    '[
      {
        "name": "React - The Complete Guide",
        "issuer": "Udemy / Academind",
        "date": "2022-11-20",
        "url": "https://udemy.com"
      }
    ]'::jsonb,
    '[
      {
        "language": "İngilizce",
        "level": "advanced"
      }
    ]'::jsonb,
    '[
      {
        "title": "Hobiler & İlgi Alanları",
        "items": ["Gitar çalmak", "Yelken sporu", "Teknoloji blogu yazarlığı"]
      }
    ]'::jsonb,
    'modern',
    '#3B82F6',
    '[
      {
        "title": "YBS Topluluk Portalı",
        "description": "Öğrenci platformu ve andıç modülü içeren tam kapsamlı Next.js web uygulaması projesi.",
        "technologies": ["Next.js", "Supabase", "TailwindCSS"],
        "url": "https://github.com/ahmetyilmaz-test/topluluk-portali",
        "date": "2024-03-01"
      }
    ]'::jsonb,
    '[
      {
        "name": "Dr. Öğr. Üyesi Murat Demir",
        "position": "Akademisyen",
        "company": "Dokuz Eylül Üniversitesi",
        "email": "murat.demir@deu.edu.tr"
      }
    ]'::jsonb
  ),
  
  -- 2. Ayşe Demir'in CV Verisi
  (
    '22222222-2222-2222-2222-222222222222',
    '[
      {
        "school": "Dokuz Eylül Üniversitesi",
        "degree": "Lisans",
        "field": "Yönetim Bilişim Sistemleri",
        "location": "İzmir, Türkiye",
        "gpa": "3.72",
        "startDate": "2020-09-15",
        "endDate": "2026-06-15",
        "current": false
      }
    ]'::jsonb,
    '[
      {
        "company": "Bilişim Analitik A.Ş.",
        "title": "Data Analyst Intern",
        "location": "İstanbul, Türkiye",
        "description": "SQL ile verilerin çekilmesi, Python (Pandas/NumPy) ile veri temizleme ve PowerBI yardımıyla yönetim raporlarının görselleştirilmesi adımları gerçekleştirildi.",
        "startDate": "2023-07-01",
        "endDate": "2023-09-01",
        "current": false
      }
    ]'::jsonb,
    ARRAY['Python', 'SQL', 'Power BI', 'Pandas', 'NumPy', 'PostgreSQL', 'Excel']::text[],
    '[
      {
        "name": "Google Data Analytics Professional Certificate",
        "issuer": "Google / Coursera",
        "date": "2023-03-15",
        "url": "https://coursera.org"
      }
    ]'::jsonb,
    '[
      {
        "language": "İngilizce",
        "level": "advanced"
      },
      {
        "language": "Almanca",
        "level": "beginner"
      }
    ]'::jsonb,
    '[]'::jsonb,
    'elegant',
    '#10B981',
    '[
      {
        "title": "Müşteri Kayıp (Churn) Analizi",
        "description": "Python kullanarak telekomünikasyon sektörü için churn tahmin modeli oluşturulması.",
        "technologies": ["Python", "Scikit-Learn", "Pandas"],
        "url": null,
        "date": "2023-12-01"
      }
    ]'::jsonb,
    '[]'::jsonb
  ),

  -- 3. Mehmet Kaya'nın CV Verisi
  (
    '33333333-3333-3333-3333-333333333333',
    '[
      {
        "school": "Dokuz Eylül Üniversitesi",
        "degree": "Lisans",
        "field": "Bilgisayar Mühendisliği",
        "location": "İzmir, Türkiye",
        "gpa": "3.20",
        "startDate": "2020-09-15",
        "endDate": "2026-06-15",
        "current": false
      }
    ]'::jsonb,
    '[
      {
        "company": "BulutYazılım Ltd.",
        "title": "Backend Developer",
        "location": "İzmir, Türkiye",
        "description": "Spring Boot framework ile mikroservis mimarisinde API tasarımı yapılması ve PostgreSQL entegrasyonu.",
        "startDate": "2023-10-01",
        "endDate": null,
        "current": true
      }
    ]'::jsonb,
    ARRAY['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Kubernetes', 'REST API', 'Redis']::text[],
    '[
      {
        "name": "Certified Kubernetes Administrator (CKA)",
        "issuer": "The Linux Foundation",
        "date": "2024-01-10",
        "url": "https://linuxfoundation.org"
      }
    ]'::jsonb,
    '[
      {
        "language": "İngilizce",
        "level": "advanced"
      }
    ]'::jsonb,
    '[]'::jsonb,
    'minimal',
    '#4F46E5',
    '[
      {
        "title": "E-Ticaret Mikroservis Altyapısı",
        "description": "Dockerize edilmiş mikroservis mimarisinde çalışan ödeme ve sepet modülleri.",
        "technologies": ["Java", "Spring Boot", "Docker", "RabbitMQ"],
        "url": "https://github.com/mehmetkaya-test/ecommerce-backend",
        "date": "2024-02-15"
      }
    ]'::jsonb,
    '[]'::jsonb
  ),

  -- 4. Zeynep Çelik'in CV Verisi
  (
    '44444444-4444-4444-4444-444444444444',
    '[
      {
        "school": "Dokuz Eylül Üniversitesi",
        "degree": "Lisans",
        "field": "Yönetim Bilişim Sistemleri",
        "location": "İzmir, Türkiye",
        "gpa": "3.58",
        "startDate": "2020-09-15",
        "endDate": "2026-06-15",
        "current": false
      }
    ]'::jsonb,
    '[
      {
        "company": "Kreatif Tasarım Ajansı",
        "title": "UI/UX Intern",
        "location": "İzmir, Türkiye",
        "description": "Mobil ve web uygulamaları için kullanıcı akışlarının (User Flow) ve tel kafeslerin (Wireframe) çizilmesi, yüksek sadakatli prototiplerin oluşturulması.",
        "startDate": "2023-06-15",
        "endDate": "2023-09-15",
        "current": false
      }
    ]'::jsonb,
    ARRAY['Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Kullanıcı Testleri']::text[],
    '[
      {
        "name": "Google UX Design Professional Certificate",
        "issuer": "Google / Coursera",
        "date": "2023-02-10",
        "url": "https://coursera.org"
      }
    ]'::jsonb,
    '[
      {
        "language": "İngilizce",
        "level": "native"
      }
    ]'::jsonb,
    '[]'::jsonb,
    'creative',
    '#EC4899',
    '[
      {
        "title": "Fintech Mobil Uygulama Arayüz Tasarımı",
        "description": "Gençler için hazırlanan mobil harçlık ve tasarruf uygulamasının tüm UI/UX süreçlerinin yürütülmesi.",
        "technologies": ["Figma", "User Journey", "Prototyping"],
        "url": "https://figma.com/file/ fintech-design-test",
        "date": "2024-01-20"
      }
    ]'::jsonb,
    '[]'::jsonb
  ),

  -- 5. Can Arslan'ın CV Verisi
  (
    '55555555-5555-5555-5555-555555555555',
    '[
      {
        "school": "Dokuz Eylül Üniversitesi",
        "degree": "Lisans",
        "field": "İstatistik",
        "location": "İzmir, Türkiye",
        "gpa": "3.10",
        "startDate": "2020-09-15",
        "endDate": "2026-06-15",
        "current": false
      }
    ]'::jsonb,
    '[
      {
        "company": "VeriAnalitik Çözümler",
        "title": "Machine Learning Intern",
        "location": "İzmir, Türkiye",
        "description": "Zaman serisi analizi ile talep tahmini modellerinin Jupyter Notebook üzerinde kurulması ve R scriptlerinin optimize edilmesi.",
        "startDate": "2023-07-01",
        "endDate": "2023-09-15",
        "current": false
      }
    ]'::jsonb,
    ARRAY['R Programming', 'Python', 'Machine Learning', 'TensorFlow', 'Data Science', 'SQL']::text[],
    '[]'::jsonb,
    '[
      {
        "language": "İngilizce",
        "level": "intermediate"
      }
    ]'::jsonb,
    '[]'::jsonb,
    'modern',
    '#6366F1',
    '[
      {
        "title": "Hisse Senedi Fiyat Tahmin Sistemi",
        "description": "LSTM (Derin Öğrenme) ağları kullanılarak finansal veri analizi ve fiyat tahmini.",
        "technologies": ["Python", "TensorFlow", "Keras"],
        "url": null,
        "date": "2024-02-01"
      }
    ]'::jsonb,
    '[]'::jsonb
  )
ON CONFLICT (user_id) DO UPDATE SET
  education = EXCLUDED.education,
  experience = EXCLUDED.experience,
  skills = EXCLUDED.skills,
  certifications = EXCLUDED.certifications,
  languages = EXCLUDED.languages,
  custom_sections = EXCLUDED.custom_sections,
  template_name = EXCLUDED.template_name,
  primary_color = EXCLUDED.primary_color,
  projects = EXCLUDED.projects,
  "references" = EXCLUDED.references,
  updated_at = now();

-- =====================================================
-- 4. MEZUNLAR DERNEĞİ VE İŞVEREN ORGANİZASYON KAYITLARI
-- =====================================================
INSERT INTO public.organizations (
  id, name, type, description, website_url, contact_email, contact_phone, logo_url, owner_id, approval_status, is_active, created_at
)
VALUES
  -- 1. Dokuz Eylül YBS Mezunlar Derneği (Dernek/Association)
  (
    'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Dokuz Eylül YBS Mezunlar Derneği',
    'association',
    'Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri bölümünden mezun olan öğrencilerin iş hayatındaki iletişimlerini güçlendirmek, öğrencilere mentörlük ve burs imkanları sunmak amacıyla kurulmuş resmi mezun topluluğu.',
    'https://deuybsdernek.org',
    'iletisim@deuybsdernek.org',
    '+90 232 301 00 99',
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&h=200&q=80',
    '99999999-9999-9999-9999-999999999999',
    'approved',
    true,
    now()
  ),
  
  -- 2. TeknoBilişim A.Ş. (İşveren/Employer)
  (
    'd2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'TeknoBilişim A.Ş.',
    'employer',
    'TeknoBilişim A.Ş., büyük ölçekli kurumsal yazılımlar, mobil uygulamalar, veri analitiği ve bulut altyapı çözümleri üreten, 150+ çalışanı olan yenilikçi bir teknoloji şirketidir.',
    'https://teknobilisim.com',
    'hr@teknobilisim.com',
    '+90 212 555 01 02',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&h=200&q=80',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'approved',
    true,
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. ANDIÇ PROFİLLERİNİN (YEARBOOK_PROFILES) OLUŞTURULMASI (Mezuniyet yılları 2026 olarak güncellendi)
-- =====================================================
INSERT INTO public.yearbook_profiles (user_id, department_id, graduation_year, education_type, is_visible, message)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM public.yearbook_departments WHERE name = 'Yönetim Bilişim Sistemleri' LIMIT 1),
    2026,
    'primary',
    true,
    'Geriye dönüp baktığımda harika dostluklar ve unutulmaz anılar biriktirdiğimi görüyorum. Her şey için teşekkürler YBS!'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM public.yearbook_departments WHERE name = 'Yönetim Bilişim Sistemleri' LIMIT 1),
    2026,
    'primary',
    true,
    'Uykusuz geçen sınav geceleri, projeler ve bitmek bilmeyen kod hataları... Hepsi bugün aldığımız bu diplomaya değdi!'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    (SELECT id FROM public.yearbook_departments WHERE name = 'Bilgisayar Mühendisliği' LIMIT 1),
    2026,
    'secondary',
    true,
    'Kampüste geçirdiğim her saniye bana çok şey kattı. Mühendislik fakültesinin bana kazandırdığı analitik bakış açısı paha biçilemez.'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM public.yearbook_departments WHERE name = 'Yönetim Bilişim Sistemleri' LIMIT 1),
    2026,
    'primary',
    true,
    'Kariyerimin ilk adımlarını bu güzel toplulukla atmaktan gurur duyuyorum. Gelecek bizim!'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    (SELECT id FROM public.yearbook_departments WHERE name = 'İstatistik' LIMIT 1),
    2026,
    'primary',
    true,
    'Verilerle geçen 4 yılın ardından artık mezunum. Olasılıklar her zaman yanınızda olsun!'
  )
ON CONFLICT (user_id) DO UPDATE SET
  graduation_year = EXCLUDED.graduation_year,
  department_id = EXCLUDED.department_id,
  education_type = EXCLUDED.education_type,
  is_visible = EXCLUDED.is_visible,
  message = EXCLUDED.message,
  updated_at = now();

-- =====================================================
-- 6. KARŞILIKLI ANDIÇ YAZILARININ (YEARBOOK_ENTRIES) EKLENMESİ
-- =====================================================
INSERT INTO public.yearbook_entries (sender_id, recipient_id, content, is_approved)
VALUES
  -- Ahmet'in profilindeki yazılar (2 onaylı, 1 bekleyen)
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Ahmet, 4 yıl boyunca gösterdiğin liderlik ve her zaman yardıma hazır olman bizi çok motive etti. Yolun açık olsun dostum!', true),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Ortak projelerimizde bana kattıkların için teşekkür ederim. Sektörde çok başarılı olacağından eminim.', true),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Ahmet, sınav haftalarındaki sabahlamalarımızı hiç unutmayacağım. Umarım dostluğumuz ömür boyu sürer. (ONAY BEKLEYEN YAZI)', false),

  -- Ayşe'nin profilindeki yazılar (2 onaylı)
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Ayşe, enerjinle her zaman sınıfa neşe kattın. Harika bir arkadaş ve mükemmel bir takım çalışması ortağıydın.', true),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Canım arkadaşım, okul bitti ama bizim hikayemiz yeni başlıyor. İyi ki varsın!', true),

  -- Mehmet'in profilindeki yazılar (1 onaylı, 1 bekleyen)
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Mühendislik binasındaki kantin sohbetlerimizi ve bitmek bilmeyen algoritma tartışmalarımızı özleyeceğim.', true),
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Bana veri analizi projelerimde yardım ettiğin için çok teşekkürler Mehmet. (ONAY BEKLEYEN YAZI)', false)
ON CONFLICT (sender_id, recipient_id) DO NOTHING;
