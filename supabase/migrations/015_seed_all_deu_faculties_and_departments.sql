-- 1. Fakülteleri Ekle (Zaten var olanlar atlanır)
INSERT INTO public.yearbook_faculties (name) VALUES
  ('Buca Eğitim Fakültesi'),
  ('Mühendislik Fakültesi'),
  ('İktisadi ve İdari Bilimler Fakültesi'),
  ('İşletme Fakültesi'),
  ('Edebiyat Fakültesi'),
  ('Fen Fakültesi'),
  ('Mimarlık Fakültesi'),
  ('Denizcilik Fakültesi'),
  ('Tıp Fakültesi'),
  ('Diş Hekimliği Fakültesi'),
  ('Hemşirelik Fakültesi'),
  ('Fizik Tedavi ve Rehabilitasyon Fakültesi'),
  ('Hukuk Fakültesi'),
  ('İlahiyat Fakültesi'),
  ('Turizm Fakültesi'),
  ('Güzel Sanatlar Fakültesi'),
  ('Veteriner Fakültesi'),
  ('Necat Hepkon Spor Bilimleri Fakültesi')
ON CONFLICT (name) DO NOTHING;

-- 2. Bölümleri Ekle (Zaten var olanlar atlanır)

-- Buca Eğitim Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Bilgisayar ve Öğretim Teknolojileri Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Fen Bilgisi Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Matematik Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'İlköğretim Matematik Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Okul Öncesi Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Rehberlik ve Psikolojik Danışmanlık'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Sınıf Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Sosyal Bilgiler Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Türkçe Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Tarih Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Coğrafya Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Felsefe Grubu Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Türk Dili ve Edebiyatı Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'İngilizce Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Almanca Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Fransızca Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Buca Eğitim Fakültesi' LIMIT 1), 'Özel Eğitim Öğretmenliği')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Mühendislik Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1), 'Bilgisayar Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1), 'Elektrik-Elektronik Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1), 'Endüstri Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1), 'Makine Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1), 'İnşaat Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1), 'Çevre Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1), 'Jeoloji Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1), 'Jeofizik Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1), 'Maden Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1), 'Metalurji ve Malzeme Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mühendislik Fakültesi' LIMIT 1), 'Tekstil Mühendisliği')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- İktisadi ve İdari Bilimler Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İktisadi ve İdari Bilimler Fakültesi' LIMIT 1), 'Yönetim Bilişim Sistemleri'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İktisadi ve İdari Bilimler Fakültesi' LIMIT 1), 'İşletme'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İktisadi ve İdari Bilimler Fakültesi' LIMIT 1), 'İktisat'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İktisadi ve İdari Bilimler Fakültesi' LIMIT 1), 'Kamu Yönetimi'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İktisadi ve İdari Bilimler Fakültesi' LIMIT 1), 'Maliye'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İktisadi ve İdari Bilimler Fakültesi' LIMIT 1), 'Ekonometri'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İktisadi ve İdari Bilimler Fakültesi' LIMIT 1), 'Çalışma Ekonomisi ve Endüstri İlişkileri'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İktisadi ve İdari Bilimler Fakültesi' LIMIT 1), 'Uluslararası İlişkiler')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- İşletme Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İşletme Fakültesi' LIMIT 1), 'İşletme (İngilizce)'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İşletme Fakültesi' LIMIT 1), 'İktisat (İngilizce)'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İşletme Fakültesi' LIMIT 1), 'Uluslararası İlişkiler (İngilizce)'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İşletme Fakültesi' LIMIT 1), 'Uluslararası Ticaret ve İşletmecilik (İngilizce)'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İşletme Fakültesi' LIMIT 1), 'Turizm İşletmeciliği (İngilizce)')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Edebiyat Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Edebiyat Fakültesi' LIMIT 1), 'Psikoloji'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Edebiyat Fakültesi' LIMIT 1), 'Sosyoloji'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Edebiyat Fakültesi' LIMIT 1), 'Tarih'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Edebiyat Fakültesi' LIMIT 1), 'Türk Dili ve Edebiyatı'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Edebiyat Fakültesi' LIMIT 1), 'Arkeoloji'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Edebiyat Fakültesi' LIMIT 1), 'Felsefe'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Edebiyat Fakültesi' LIMIT 1), 'İngilizce Mütercim ve Tercümanlık'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Edebiyat Fakültesi' LIMIT 1), 'Amerikan Kültürü ve Edebiyatı'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Edebiyat Fakültesi' LIMIT 1), 'Rus Dili ve Edebiyatı'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Edebiyat Fakültesi' LIMIT 1), 'Müzecilik')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Fen Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Fen Fakültesi' LIMIT 1), 'Bilgisayar Bilimleri'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Fen Fakültesi' LIMIT 1), 'Biyoloji'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Fen Fakültesi' LIMIT 1), 'Fizik'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Fen Fakültesi' LIMIT 1), 'Kimya'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Fen Fakültesi' LIMIT 1), 'Matematik'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Fen Fakültesi' LIMIT 1), 'İstatistik')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Mimarlık Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mimarlık Fakültesi' LIMIT 1), 'Mimarlık'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Mimarlık Fakültesi' LIMIT 1), 'Şehir ve Bölge Planlama')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Denizcilik Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Denizcilik Fakültesi' LIMIT 1), 'Deniz Ulaştırma İşletme Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Denizcilik Fakültesi' LIMIT 1), 'Denizcilik İşletmeleri Yönetimi'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Denizcilik Fakültesi' LIMIT 1), 'Gemi Makineleri İşletme Mühendisliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Denizcilik Fakültesi' LIMIT 1), 'Lojistik Yönetimi')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Tıp Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Tıp Fakültesi' LIMIT 1), 'Tıp')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Diş Hekimliği Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Diş Hekimliği Fakültesi' LIMIT 1), 'Diş Hekimliği')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Hemşirelik Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Hemşirelik Fakültesi' LIMIT 1), 'Hemşirelik')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Fizik Tedavi ve Rehabilitasyon Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Fizik Tedavi ve Rehabilitasyon Fakültesi' LIMIT 1), 'Fizik Tedavi ve Rehabilitasyon')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Hukuk Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Hukuk Fakültesi' LIMIT 1), 'Hukuk')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- İlahiyat Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İlahiyat Fakültesi' LIMIT 1), 'İlahiyat'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'İlahiyat Fakültesi' LIMIT 1), 'İlköğretim Din Kültürü ve Ahlak Bilgisi Öğretmenliği')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Turizm Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Turizm Fakültesi' LIMIT 1), 'Turizm İşletmeciliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Turizm Fakültesi' LIMIT 1), 'Gastronomi ve Mutfak Sanatları'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Turizm Fakültesi' LIMIT 1), 'Turizm Rehberliği')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Güzel Sanatlar Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Güzel Sanatlar Fakültesi' LIMIT 1), 'Grafik'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Güzel Sanatlar Fakültesi' LIMIT 1), 'Resim'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Güzel Sanatlar Fakültesi' LIMIT 1), 'Heykel'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Güzel Sanatlar Fakültesi' LIMIT 1), 'Seramik ve Cam Tasarımı'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Güzel Sanatlar Fakültesi' LIMIT 1), 'Tekstil ve Moda Tasarımı'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Güzel Sanatlar Fakültesi' LIMIT 1), 'Sahne Sanatları'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Güzel Sanatlar Fakültesi' LIMIT 1), 'Sinema ve Televizyon'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Güzel Sanatlar Fakültesi' LIMIT 1), 'Müzik Bilimleri'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Güzel Sanatlar Fakültesi' LIMIT 1), 'Geleneksel Türk Sanatları'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Güzel Sanatlar Fakültesi' LIMIT 1), 'Fotoğraf')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Veteriner Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Veteriner Fakültesi' LIMIT 1), 'Veteriner Hekimlik')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- Necat Hepkon Spor Bilimleri Fakültesi
INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Necat Hepkon Spor Bilimleri Fakültesi' LIMIT 1), 'Beden Eğitimi ve Spor Öğretmenliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Necat Hepkon Spor Bilimleri Fakültesi' LIMIT 1), 'Antrenörlük Eğitimi'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Necat Hepkon Spor Bilimleri Fakültesi' LIMIT 1), 'Spor Yöneticiliği'),
  ((SELECT id FROM public.yearbook_faculties WHERE name = 'Necat Hepkon Spor Bilimleri Fakültesi' LIMIT 1), 'Rekreasyon')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;
