export interface Department {
  name: string;
  nameEn: string;
}

export interface Faculty {
  name: string;
  nameEn: string;
  departments: Department[];
}

export const DEU_FACULTIES: Faculty[] = [
  {
    name: "Buca Eğitim Fakültesi",
    nameEn: "Buca Faculty of Education",
    departments: [
      { name: "Bilgisayar ve Öğretim Teknolojileri Öğretmenliği", nameEn: "Computer Education and Instructional Technology" },
      { name: "Fen Bilgisi Öğretmenliği", nameEn: "Science Education" },
      { name: "Matematik Öğretmenliği", nameEn: "Mathematics Education" },
      { name: "İlköğretim Matematik Öğretmenliği", nameEn: "Elementary Mathematics Education" },
      { name: "Okul Öncesi Öğretmenliği", nameEn: "Early Childhood Education" },
      { name: "Rehberlik ve Psikolojik Danışmanlık", nameEn: "Guidance and Psychological Counseling" },
      { name: "Sınıf Öğretmenliği", nameEn: "Primary School Education" },
      { name: "Sosyal Bilgiler Öğretmenliği", nameEn: "Social Studies Education" },
      { name: "Türkçe Öğretmenliği", nameEn: "Turkish Language Education" },
      { name: "Tarih Öğretmenliği", nameEn: "History Education" },
      { name: "Coğrafya Öğretmenliği", nameEn: "Geography Education" },
      { name: "Felsefe Grubu Öğretmenliği", nameEn: "Philosophy Education" },
      { name: "Türk Dili ve Edebiyatı Öğretmenliği", nameEn: "Turkish Language and Literature Education" },
      { name: "İngilizce Öğretmenliği", nameEn: "English Language Education" },
      { name: "Almanca Öğretmenliği", nameEn: "German Language Education" },
      { name: "Fransızca Öğretmenliği", nameEn: "French Language Education" },
      { name: "Özel Eğitim Öğretmenliği", nameEn: "Special Education" }
    ]
  },
  {
    name: "Mühendislik Fakültesi",
    nameEn: "Faculty of Engineering",
    departments: [
      { name: "Bilgisayar Mühendisliği", nameEn: "Computer Engineering" },
      { name: "Elektrik-Elektronik Mühendisliği", nameEn: "Electrical and Electronics Engineering" },
      { name: "Endüstri Mühendisliği", nameEn: "Industrial Engineering" },
      { name: "Makine Mühendisliği", nameEn: "Mechanical Engineering" },
      { name: "İnşaat Mühendisliği", nameEn: "Civil Engineering" },
      { name: "Çevre Mühendisliği", nameEn: "Environmental Engineering" },
      { name: "Jeoloji Mühendisliği", nameEn: "Geological Engineering" },
      { name: "Jeofizik Mühendisliği", nameEn: "Geophysical Engineering" },
      { name: "Maden Mühendisliği", nameEn: "Mining Engineering" },
      { name: "Metalurji ve Malzeme Mühendisliği", nameEn: "Metallurgical and Materials Engineering" },
      { name: "Tekstil Mühendisliği", nameEn: "Textile Engineering" }
    ]
  },
  {
    name: "İktisadi ve İdari Bilimler Fakültesi",
    nameEn: "Faculty of Economics and Administrative Sciences",
    departments: [
      { name: "Yönetim Bilişim Sistemleri", nameEn: "Management Information Systems" },
      { name: "İşletme", nameEn: "Business Administration" },
      { name: "İktisat", nameEn: "Economics" },
      { name: "Kamu Yönetimi", nameEn: "Public Administration" },
      { name: "Maliye", nameEn: "Public Finance" },
      { name: "Ekonometri", nameEn: "Econometrics" },
      { name: "Çalışma Ekonomisi ve Endüstri İlişkileri", nameEn: "Labour Economics and Industrial Relations" },
      { name: "Uluslararası İlişkiler", nameEn: "International Relations" }
    ]
  },
  {
    name: "İşletme Fakültesi",
    nameEn: "Faculty of Business",
    departments: [
      { name: "İşletme (İngilizce)", nameEn: "Business Administration (English)" },
      { name: "İktisat (İngilizce)", nameEn: "Economics (English)" },
      { name: "Uluslararası İlişkiler (İngilizce)", nameEn: "International Relations (English)" },
      { name: "Uluslararası Ticaret ve İşletmecilik (İngilizce)", nameEn: "International Trade and Business (English)" },
      { name: "Turizm İşletmeciliği (İngilizce)", nameEn: "Tourism Management (English)" }
    ]
  },
  {
    name: "Edebiyat Fakültesi",
    nameEn: "Faculty of Letters",
    departments: [
      { name: "Psikoloji", nameEn: "Psychology" },
      { name: "Sosyoloji", nameEn: "Sociology" },
      { name: "Tarih", nameEn: "History" },
      { name: "Türk Dili ve Edebiyatı", nameEn: "Turkish Language and Literature" },
      { name: "Arkeoloji", nameEn: "Archaeology" },
      { name: "Felsefe", nameEn: "Philosophy" },
      { name: "İngilizce Mütercim ve Tercümanlık", nameEn: "English Translation and Interpreting" },
      { name: "Amerikan Kültürü ve Edebiyatı", nameEn: "American Culture and Literature" },
      { name: "Rus Dili ve Edebiyatı", nameEn: "Russian Language and Literature" },
      { name: "Müzecilik", nameEn: "Museum Studies" }
    ]
  },
  {
    name: "Fen Fakültesi",
    nameEn: "Faculty of Science",
    departments: [
      { name: "Bilgisayar Bilimleri", nameEn: "Computer Science" },
      { name: "Biyoloji", nameEn: "Biology" },
      { name: "Fizik", nameEn: "Physics" },
      { name: "Kimya", nameEn: "Chemistry" },
      { name: "Matematik", nameEn: "Mathematics" },
      { name: "İstatistik", nameEn: "Statistics" }
    ]
  },
  {
    name: "Mimarlık Fakültesi",
    nameEn: "Faculty of Architecture",
    departments: [
      { name: "Mimarlık", nameEn: "Architecture" },
      { name: "Şehir ve Bölge Planlama", nameEn: "City and Regional Planning" }
    ]
  },
  {
    name: "Denizcilik Fakültesi",
    nameEn: "Maritime Faculty",
    departments: [
      { name: "Deniz Ulaştırma İşletme Mühendisliği", nameEn: "Marine Transportation Engineering" },
      { name: "Denizcilik İşletmeleri Yönetimi", nameEn: "Maritime Business Administration" },
      { name: "Gemi Makineleri İşletme Mühendisliği", nameEn: "Marine Engineering" },
      { name: "Lojistik Yönetimi", nameEn: "Logistics Management" }
    ]
  },
  {
    name: "Tıp Fakültesi",
    nameEn: "Faculty of Medicine",
    departments: [
      { name: "Tıp", nameEn: "Medicine" }
    ]
  },
  {
    name: "Diş Hekimliği Fakültesi",
    nameEn: "Faculty of Dentistry",
    departments: [
      { name: "Diş Hekimliği", nameEn: "Dentistry" }
    ]
  },
  {
    name: "Hemşirelik Fakültesi",
    nameEn: "Faculty of Nursing",
    departments: [
      { name: "Hemşirelik", nameEn: "Nursing" }
    ]
  },
  {
    name: "Fizik Tedavi ve Rehabilitasyon Fakültesi",
    nameEn: "Faculty of Physical Therapy and Rehabilitation",
    departments: [
      { name: "Fizik Tedavi ve Rehabilitasyon", nameEn: "Physical Therapy and Rehabilitation" }
    ]
  },
  {
    name: "Hukuk Fakültesi",
    nameEn: "Faculty of Law",
    departments: [
      { name: "Hukuk", nameEn: "Law" }
    ]
  },
  {
    name: "İlahiyat Fakültesi",
    nameEn: "Faculty of Theology",
    departments: [
      { name: "İlahiyat", nameEn: "Theology" },
      { name: "İlköğretim Din Kültürü ve Ahlak Bilgisi Öğretmenliği", nameEn: "Religious Culture and Moral Education" }
    ]
  },
  {
    name: "Turizm Fakültesi",
    nameEn: "Faculty of Tourism",
    departments: [
      { name: "Turizm İşletmeciliği", nameEn: "Tourism Management" },
      { name: "Gastronomi ve Mutfak Sanatları", nameEn: "Gastronomy and Culinary Arts" },
      { name: "Turizm Rehberliği", nameEn: "Tourism Guidance" }
    ]
  },
  {
    name: "Güzel Sanatlar Fakültesi",
    nameEn: "Faculty of Fine Arts",
    departments: [
      { name: "Grafik", nameEn: "Graphic Design" },
      { name: "Resim", nameEn: "Painting" },
      { name: "Heykel", nameEn: "Sculpture" },
      { name: "Seramik ve Cam Tasarımı", nameEn: "Ceramic and Glass Design" },
      { name: "Tekstil ve Moda Tasarımı", nameEn: "Textile and Fashion Design" },
      { name: "Sahne Sanatları", nameEn: "Performing Arts" },
      { name: "Sinema ve Televizyon", nameEn: "Film and Television" },
      { name: "Müzik Bilimleri", nameEn: "Musicology" },
      { name: "Geleneksel Türk Sanatları", nameEn: "Traditional Turkish Arts" },
      { name: "Fotoğraf", nameEn: "Photography" }
    ]
  },
  {
    name: "Veteriner Fakültesi",
    nameEn: "Faculty of Veterinary Medicine",
    departments: [
      { name: "Veteriner Hekimlik", nameEn: "Veterinary Medicine" }
    ]
  },
  {
    name: "Necat Hepkon Spor Bilimleri Fakültesi",
    nameEn: "Necat Hepkon Faculty of Sports Sciences",
    departments: [
      { name: "Beden Eğitimi ve Spor Öğretmenliği", nameEn: "Physical Education and Sports Teacher Education" },
      { name: "Antrenörlük Eğitimi", nameEn: "Coaching Education" },
      { name: "Spor Yöneticiliği", nameEn: "Sports Management" },
      { name: "Rekreasyon", nameEn: "Recreation" }
    ]
  }
];
