-- ============================================================
-- 018: Test İçin Örnek İş & Staj İlanları ve Otomatik Tohumlama
-- ============================================================

DO $$
DECLARE
  v_employer_id UUID;
  v_org_id UUID;
BEGIN
  -- 1. Var olan ilk aktifi veya işvereni bul
  SELECT id INTO v_employer_id FROM public.profiles LIMIT 1;

  -- 2. Örnek bir onaylı organizasyon var mı kontrol et, yoksa oluştur
  SELECT id INTO v_org_id FROM public.organizations WHERE approval_status = 'approved' LIMIT 1;

  IF v_org_id IS NULL AND v_employer_id IS NOT NULL THEN
    INSERT INTO public.organizations (
      name, type, description, website_url, contact_email, owner_id, approval_status, is_active
    ) VALUES (
      'Teknoloji A.Ş.', 'employer', 'Öncü yazılım ve teknoloji şirketi.', 'https://example.com', 'iletisim@teknoloji.com', v_employer_id, 'approved', true
    ) RETURNING id INTO v_org_id;
  END IF;

  -- 3. Eğer profile ve org bulunduysa örnek ilanları ekle
  IF v_employer_id IS NOT NULL THEN
    INSERT INTO public.job_listings (
      employer_id, organization_id, title, description, category, employment_type, work_mode, location, requirements, deadline, is_active
    ) VALUES
    (
      v_employer_id,
      v_org_id,
      'Full Stack Developer (Next.js & Node.js)',
      'Ekibimize katılmak üzere modern web teknolojilerine hakim, kullanıcı deneyimine önem veren Full Stack Geliştirici arıyoruz. Projelerimizde Next.js 15, Tailwind CSS, TypeScript ve PostgreSQL kullanılmaktadır.',
      'software_it',
      'full_time',
      'hybrid',
      'İzmir / Hibrit',
      ARRAY['En az 2 yıl React / Next.js tecrübesi', 'TypeScript ve PostgreSQL hakimiyeti', 'Git ve CI/CD süreçlerine aşinalık', 'İyi derecede İngilizce'],
      now() + interval '30 days',
      true
    ),
    (
      v_employer_id,
      v_org_id,
      'Yapay Zeka & Veri Analisti Stajyeri',
      'Büyük veri setleri üzerinde makine öğrenmesi modelleri geliştirecek, Python ve pandas kütüphanelerine hakim stajyer takım arkadaşları arıyoruz. Veri görselleştirme ve raporlama süreçlerinde aktif rol alacaksınız.',
      'data_science',
      'internship',
      'remote',
      'Uzaktan / Türkiye',
      ARRAY['YBS, Bilgisayar Mühendisliği veya İstatistik öğrencisi', 'Python, Pandas, NumPy ve Scikit-learn bilgisi', 'SQL sorgulama becerisi', 'Problem çözme yeteneği'],
      now() + interval '14 days',
      true
    ),
    (
      v_employer_id,
      v_org_id,
      'Dijital Pazarlama & Sosyal Medya Uzmanı',
      'Sosyal medya hesaplarımızın yönetimi, Google Ads & Meta Ads reklam kampanyalarının kurgulanması ve performans analizi süreçlerini yönetecek çalışma arkadaşı arıyoruz.',
      'marketing',
      'full_time',
      'onsite',
      'Alsancak, İzmir',
      ARRAY['Dijital pazarlama ve SEO konularında tecrübe', 'Google Analytics ve Meta Business Suite kullanımı', 'İçerik üretimi ve metin yazarlığı becerisi'],
      now() + interval '20 days',
      true
    ),
    (
      v_employer_id,
      v_org_id,
      'UI/UX Tasarım Stajyeri',
      'Kullanıcı dostu arayüzler ve prototipler tasarlayacak, Figma platformuna hakim, estetik bakış açısına sahip stajyer arıyoruz.',
      'design',
      'internship',
      'remote',
      'Uzaktan',
      ARRAY['Figma veya Adobe XD kullanımı', 'UI/UX tasarım prensiplerine hakimiyet', 'Portfolyo sunabilme'],
      now() + interval '10 days',
      true
    ),
    (
      v_employer_id,
      v_org_id,
      'İnsan Kaynakları & İşe Alım Yarı Zamanlı Uzmanı',
      'Stajyer ve junior pozisyonların işe alım süreçlerinde aday tarama, mülakat organizasyonları ve oryantasyon süreçlerini destekleyecek yarı zamanlı ekip arkadaşı arıyoruz.',
      'human_resources',
      'part_time',
      'hybrid',
      'Konak, İzmir',
      ARRAY['İnsan Kaynakları veya YBS öğrencisi', 'Etkili iletişim ve organizasyon becerisi', 'Haftada en az 2.5 gün katılım'],
      now() + interval '25 days',
      true
    );
  END IF;
END $$;
