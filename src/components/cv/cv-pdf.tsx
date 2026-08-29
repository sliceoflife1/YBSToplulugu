import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
// Not: Svg/Path daha önce simge desteği için import edilmiş ama hiçbir şablonda
// kullanılmamıştı (ölü kod). İkon yerine, react-pdf'in Roboto fontuyla %100 uyumlu,
// görsel olarak doğrulanmış düz metin etiketler / ayıraçlar tercih edildi —
// bkz. aşağıdaki "emoji yerine metin" notları.
import type { Profile, CvData, CvEducation, CvExperience, CvCertification, CvLanguage, CvProject, CvReference, CvCustomSection } from "@/types/database";
import { formatDateRange } from "@/lib/cv/normalize";

// Türkçe karakter desteği için Roboto yazı tipini kaydet
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }
  ]
});

// URL'leri temizleyen yardımcı fonksiyon
function formatUrlLabel(url: string) {
  if (!url) return "";
  return url.replace(/https?:\/\/(www\.)?/, "");
}

interface CvPdfProps {
  profile: Profile;
  cvData?: CvData | null;
  skills: string[];
  education: CvEducation[];
  experience: CvExperience[];
  certifications?: CvCertification[];
  languages?: CvLanguage[];
  projects?: CvProject[];
  references?: CvReference[];
  customSections?: CvCustomSection[];
  templateName?: string;
  primaryColor?: string;
}

// ----------------------------------------------------
// 1. STANDART / TOPLULUK ŞABLONU (Varsayılan 2 Kolon)
// ----------------------------------------------------
const standardStyles = StyleSheet.create({
  page: {
    paddingLeft: 195,
    paddingRight: 25,
    paddingTop: 30,
    paddingBottom: 50,
    fontFamily: 'Roboto',
    fontSize: 9,
    lineHeight: 1.4,
    color: '#333333',
    backgroundColor: '#ffffff',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 175,
    backgroundColor: '#202d3d',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 32,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#ffffff',
    objectFit: 'cover',
  },
  sidebarSection: {
    marginBottom: 16,
  },
  sidebarTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
    paddingBottom: 4,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sidebarItem: {
    marginBottom: 5,
  },
  sidebarLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  sidebarText: {
    fontSize: 8,
    color: '#e2e8f0',
    lineHeight: 1.3,
  },
  sidebarTextBold: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  sidebarDate: {
    fontSize: 7.5,
    color: '#94a3b8',
    marginBottom: 4,
  },
  mainHeaderContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 10,
  },
  mainName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 1.2,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0ea5e9',
    lineHeight: 1.3,
  },
  mainSection: {
    marginBottom: 14,
  },
  mainSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 3,
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mainBioText: {
    fontSize: 8.5,
    lineHeight: 1.45,
    color: '#334155',
  },
  mainItemGroup: {
    marginBottom: 10,
  },
  mainItemSubtitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  mainItemTitle: {
    fontSize: 8.5,
    color: '#64748b',
    marginBottom: 3,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    right: 25,
    color: '#94a3b8',
  },
});

function StandardTemplate({ profile, skills, education, experience, certifications = [], languages = [], projects = [], references = [], customSections = [], primaryColor = '#0ea5e9' }: CvPdfProps) {
  const dynamicTitleStyle = [standardStyles.mainTitle, { color: primaryColor }];
  return (
    <Document>
      <Page size="A4" style={standardStyles.page} wrap={true}>
        {/* Sol Sabit Kolon */}
        <View style={standardStyles.sidebar} fixed>
          {profile.avatar_url ? (
            <View style={standardStyles.avatarContainer}>
              <Image src={profile.avatar_url} style={standardStyles.avatar} />
            </View>
          ) : null}

          {/* İletişim */}
          <View style={standardStyles.sidebarSection}>
            <Text style={standardStyles.sidebarTitle}>İLETİŞİM</Text>
            {profile.location ? (
              <View style={standardStyles.sidebarItem}>
                <Text style={standardStyles.sidebarLabel}>KONUM</Text>
                <Text style={standardStyles.sidebarText}>{profile.location}</Text>
              </View>
            ) : null}

            {profile.phone ? (
              <View style={standardStyles.sidebarItem}>
                <Text style={standardStyles.sidebarLabel}>TELEFON</Text>
                <Text style={standardStyles.sidebarText}>{profile.phone}</Text>
              </View>
            ) : null}

            <View style={standardStyles.sidebarItem}>
              <Text style={standardStyles.sidebarLabel}>E-POSTA</Text>
              <Text style={standardStyles.sidebarText}>{profile.edu_email}</Text>
            </View>

            {profile.website_url ? (
              <View style={standardStyles.sidebarItem}>
                <Text style={standardStyles.sidebarLabel}>WEB</Text>
                <Text style={standardStyles.sidebarText}>{formatUrlLabel(profile.website_url)}</Text>
              </View>
            ) : null}
          </View>

          {/* Eğitim */}
          {education.length > 0 ? (
            <View style={standardStyles.sidebarSection}>
              <Text style={standardStyles.sidebarTitle}>EĞİTİM</Text>
              {education.map((edu, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <Text style={standardStyles.sidebarTextBold}>{edu.school}</Text>
                  <Text style={standardStyles.sidebarText}>{edu.degree} - {edu.field}</Text>
                  <Text style={standardStyles.sidebarDate}>{formatDateRange(edu.startDate || (edu as any).start_date, edu.endDate || (edu as any).end_date, edu.current)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Yetenekler */}
          {skills.length > 0 ? (
            <View style={standardStyles.sidebarSection}>
              <Text style={standardStyles.sidebarTitle}>YETENEKLER</Text>
              {skills.map((skill, i) => (
                <Text key={i} style={standardStyles.sidebarText}>• {skill}</Text>
              ))}
            </View>
          ) : null}

          {/* Diller */}
          {languages.length > 0 ? (
            <View style={standardStyles.sidebarSection}>
              <Text style={standardStyles.sidebarTitle}>DİLLER</Text>
              {languages.map((lang, i) => (
                <Text key={i} style={standardStyles.sidebarText}>• {lang.language || (lang as any).name} ({lang.level})</Text>
              ))}
            </View>
          ) : null}
        </View>

        {/* Sağ Ana İçerik */}
        <View style={standardStyles.mainHeaderContainer}>
          <Text style={standardStyles.mainName}>{profile.first_name} {profile.last_name}</Text>
          {profile.headline ? <Text style={dynamicTitleStyle}>{profile.headline}</Text> : null}
        </View>

        {profile.bio ? (
          <View style={standardStyles.mainSection}>
            <Text style={standardStyles.mainSectionTitle}>HAKKIMDA</Text>
            <Text style={standardStyles.mainBioText}>{profile.bio}</Text>
          </View>
        ) : null}

        {experience.length > 0 ? (
          <View style={standardStyles.mainSection}>
            <Text style={standardStyles.mainSectionTitle}>İŞ VE STAJ DENEYİMİ</Text>
            {experience.map((exp, i) => (
              <View key={i} style={standardStyles.mainItemGroup}>
                <Text style={standardStyles.mainItemSubtitle}>{exp.company} — {exp.title || (exp as any).position}</Text>
                <Text style={standardStyles.mainItemTitle}>{formatDateRange(exp.startDate || (exp as any).start_date, exp.endDate || (exp as any).end_date, exp.current)} | {exp.location || 'İzmir, Türkiye'}</Text>
                {exp.description ? <Text style={standardStyles.mainBioText}>{exp.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {projects.length > 0 ? (
          <View style={standardStyles.mainSection}>
            <Text style={standardStyles.mainSectionTitle}>PROJELER</Text>
            {projects.map((proj, i) => (
              <View key={i} style={standardStyles.mainItemGroup}>
                <Text style={standardStyles.mainItemSubtitle}>{proj.title}</Text>
                {proj.description ? <Text style={standardStyles.mainBioText}>{proj.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {certifications.length > 0 ? (
          <View style={standardStyles.mainSection}>
            <Text style={standardStyles.mainSectionTitle}>SERTİFİKALAR</Text>
            {certifications.map((cert, i) => (
              <Text key={i} style={standardStyles.mainBioText}>• {cert.name} ({cert.issuer} - {cert.date || (cert as any).issue_date})</Text>
            ))}
          </View>
        ) : null}

        {references.length > 0 ? (
          <View style={standardStyles.mainSection}>
            <Text style={standardStyles.mainSectionTitle}>REFERANSLAR</Text>
            {references.map((ref, i) => (
              <Text key={i} style={standardStyles.mainBioText}>• {ref.name} — {ref.position || (ref as any).title} ({ref.company}) - {(ref as any).contact || [ref.email, ref.phone].filter(Boolean).join(" • ")}</Text>
            ))}
          </View>
        ) : null}

        <Text style={standardStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

// ----------------------------------------------------
// 2. KURUMSAL / KLASİK ŞABLON (Gerçek Tek Kolon, Çizgili, ATS-Dostu)
//
// Düzeltilen sorunlar:
//  - exp.position artık var olmayan bir alan (bkz. normalize.ts); tüm başlıklar
//    boş görünüyordu. exp.title (+ eski veri için .position yedeği) kullanılıyor.
//  - İletişim satırındaki emoji (✉️📞📍🌐) Roboto fontunda desteklenmiyordu ve
//    metinlerin üst üste binmesine ("kaymasına") yol açıyordu; düz metin + "•"
//    ayıraçıyla değiştirildi (Standart şablonda kanıtlanmış, güvenli yöntem).
//  - Alt kısımdaki 2 sütunlu ızgara hem şablonun kendi "tek kolon" adını hem de
//    çok sayfalı belgelerde bölünme güvenliğini bozuyordu; gerçek tek sütuna çevrildi.
//  - Sertifikalar, Referanslar ve Özel Bölümler hiç gösterilmiyordu; eklendi.
//  - Sayfa numarası yoktu; Standart şablonla tutarlı hale getirildi.
// ----------------------------------------------------
const corporateStyles = StyleSheet.create({
  page: {
    padding: 38,
    paddingBottom: 55,
    fontFamily: 'Roboto',
    fontSize: 9,
    lineHeight: 1.4,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 10,
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 2,
  },
  contactBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 7,
    fontSize: 8.5,
    color: '#475569',
  },
  contactItem: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e3a8a',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  itemDate: {
    fontSize: 8,
    color: '#64748b',
  },
  itemSub: {
    fontSize: 8.5,
    color: '#475569',
    marginBottom: 3,
  },
  desc: {
    fontSize: 8.5,
    color: '#334155',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    fontSize: 8,
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    marginBottom: 4,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    right: 38,
    color: '#94a3b8',
  },
});

function CorporateTemplate({ profile, skills, education, experience, certifications = [], languages = [], projects = [], references = [], customSections = [], primaryColor = '#1e3a8a' }: CvPdfProps) {
  const dynamicHeader = [corporateStyles.header, { borderBottomColor: primaryColor }];
  const dynamicName = [corporateStyles.name, { color: primaryColor }];
  const dynamicSection = [corporateStyles.sectionTitle, { color: primaryColor }];

  const contactParts = [
    profile.edu_email,
    profile.phone,
    profile.location,
    profile.website_url ? formatUrlLabel(profile.website_url) : null,
    profile.linkedin_url ? formatUrlLabel(profile.linkedin_url) : null,
    profile.github_url ? formatUrlLabel(profile.github_url) : null,
  ].filter(Boolean) as string[];

  return (
    <Document>
      <Page size="A4" style={corporateStyles.page} wrap={true}>
        <View style={dynamicHeader}>
          <Text style={dynamicName}>{profile.first_name} {profile.last_name}</Text>
          {profile.headline ? <Text style={corporateStyles.headline}>{profile.headline}</Text> : null}
          <View style={corporateStyles.contactBar}>
            {contactParts.map((part, i) => (
              <Text key={i} style={corporateStyles.contactItem}>{i > 0 ? '•  ' : ''}{part}</Text>
            ))}
          </View>
        </View>

        {profile.bio ? (
          <View>
            <Text style={dynamicSection}>PROFESYONEL ÖZET</Text>
            <Text style={corporateStyles.desc}>{profile.bio}</Text>
          </View>
        ) : null}

        {experience.length > 0 ? (
          <View>
            <Text style={dynamicSection}>İŞ VE STAJ DENEYİMİ</Text>
            {experience.map((exp, i) => (
              <View key={i} style={{ marginBottom: 8 }} wrap={false}>
                <View style={corporateStyles.itemHeader}>
                  <Text style={corporateStyles.itemTitle}>{exp.title || (exp as any).position} — {exp.company}</Text>
                  <Text style={corporateStyles.itemDate}>{formatDateRange(exp.startDate || (exp as any).start_date, exp.endDate || (exp as any).end_date, exp.current)}</Text>
                </View>
                {exp.location ? <Text style={corporateStyles.itemSub}>{exp.location}</Text> : null}
                {exp.description ? <Text style={corporateStyles.desc}>{exp.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {education.length > 0 ? (
          <View>
            <Text style={dynamicSection}>EĞİTİM GEÇMİŞİ</Text>
            {education.map((edu, i) => (
              <View key={i} style={{ marginBottom: 6 }} wrap={false}>
                <View style={corporateStyles.itemHeader}>
                  <Text style={corporateStyles.itemTitle}>{edu.school}</Text>
                  <Text style={corporateStyles.itemDate}>{formatDateRange(edu.startDate || (edu as any).start_date, edu.endDate || (edu as any).end_date, edu.current)}</Text>
                </View>
                <Text style={corporateStyles.itemSub}>{[edu.degree, edu.field].filter(Boolean).join(' - ')}{edu.gpa ? `  •  Not Ortalaması: ${edu.gpa}` : ''}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {projects.length > 0 ? (
          <View>
            <Text style={dynamicSection}>PROJELER VE BAŞARILAR</Text>
            {projects.map((p, i) => (
              <View key={i} style={{ marginBottom: 6 }} wrap={false}>
                <Text style={corporateStyles.itemTitle}>{p.title}</Text>
                {p.description ? <Text style={corporateStyles.desc}>{p.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {skills.length > 0 ? (
          <View>
            <Text style={dynamicSection}>UZMANLIK VE YETENEKLER</Text>
            <View style={corporateStyles.badgeRow}>
              {skills.map((s, i) => (
                <Text key={i} style={corporateStyles.badge}>{s}</Text>
              ))}
            </View>
          </View>
        ) : null}

        {certifications.length > 0 ? (
          <View>
            <Text style={dynamicSection}>SERTİFİKALAR</Text>
            {certifications.map((cert, i) => (
              <View key={i} style={corporateStyles.itemHeader}>
                <Text style={corporateStyles.itemSub}>{cert.name} — {cert.issuer}</Text>
                <Text style={corporateStyles.itemDate}>{cert.date || (cert as any).issue_date}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {languages.length > 0 ? (
          <View>
            <Text style={dynamicSection}>YABANCI DİLLER</Text>
            <View style={corporateStyles.badgeRow}>
              {languages.map((l, i) => (
                <Text key={i} style={corporateStyles.badge}>{l.language || (l as any).name} · {l.level}</Text>
              ))}
            </View>
          </View>
        ) : null}

        {references.length > 0 ? (
          <View>
            <Text style={dynamicSection}>REFERANSLAR</Text>
            {references.map((ref, i) => (
              <Text key={i} style={corporateStyles.itemSub}>{ref.name} — {ref.position || (ref as any).title}{ref.company ? `, ${ref.company}` : ''} ({(ref as any).contact || [ref.email, ref.phone].filter(Boolean).join(' • ')})</Text>
            ))}
          </View>
        ) : null}

        {customSections.filter((s) => s.title && s.items?.length > 0).map((section, i) => (
          <View key={i}>
            <Text style={dynamicSection}>{section.title.toUpperCase()}</Text>
            {section.items.map((item, ii) => (
              <Text key={ii} style={corporateStyles.desc}>• {item}</Text>
            ))}
          </View>
        ))}

        <Text style={corporateStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

// ----------------------------------------------------
// 3. MODERN / MİNİMALİST ŞABLON (2 Kolon, Renkli Kartlar)
//
// Düzeltilen sorunlar:
//  - exp.position artık var olmayan bir alan; tüm deneyim başlıkları boş
//    görünüyordu. exp.title (+ eski veri için .position yedeği) kullanılıyor.
//  - EN KRİTİK YAPISAL SORUN: Sayfanın doğrudan flexDirection:'row' ile sol/sağ
//    olarak bölünmesi, react-pdf'te bilinen bir kısıtlamadır — içerik bir
//    sayfayı aştığında kenar çubuğu ikinci sayfada doğru tekrarlanmaz ve düzen
//    kayar/bozulur. Standart şablonda kanıtlanmış olan position:absolute +
//    fixed kenar çubuğu tekniğine geçildi (bkz. standardStyles.sidebar).
//  - İletişim satırındaki emoji (✉️📞📍🌐) Roboto fontunda desteklenmiyordu ve
//    metinlerin kaymasına yol açıyordu; düz etiketlerle değiştirildi.
//  - Sertifikalar, Referanslar ve Özel Bölümler hiç gösterilmiyordu; eklendi.
//  - Sayfa numarası yoktu; Standart şablonla tutarlı hale getirildi.
// ----------------------------------------------------
const MODERN_SIDEBAR_WIDTH = 172;

const modernStyles = StyleSheet.create({
  page: {
    paddingLeft: MODERN_SIDEBAR_WIDTH + 22,
    paddingRight: 24,
    paddingTop: 28,
    paddingBottom: 50,
    fontFamily: 'Roboto',
    fontSize: 8.5,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MODERN_SIDEBAR_WIDTH,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 28,
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    lineHeight: 1.25,
  },
  title: {
    fontSize: 9.5,
    color: '#38bdf8',
    marginBottom: 14,
    fontWeight: 'bold',
  },
  sideTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 3,
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sideLabel: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  sideText: {
    fontSize: 7.5,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  sideSkillText: {
    fontSize: 7.5,
    color: '#94a3b8',
    marginBottom: 3,
  },
  mainSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 7.5,
    color: '#475569',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 7.5,
    color: '#64748b',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 8,
    color: '#334155',
  },
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    right: 24,
    color: '#94a3b8',
  },
});

function ModernTemplate({ profile, skills, education, experience, certifications = [], languages = [], projects = [], references = [], customSections = [], primaryColor = '#0ea5e9' }: CvPdfProps) {
  const dynamicTitle = [modernStyles.title, { color: primaryColor }];
  const dynamicCard = [modernStyles.card, { borderLeftColor: primaryColor }];

  return (
    <Document>
      <Page size="A4" style={modernStyles.page} wrap={true}>
        {/* Sol Sabit Kenar Çubuğu (tüm sayfalarda tekrarlanır) */}
        <View style={modernStyles.sidebar} fixed>
          <Text style={modernStyles.name}>{profile.first_name} {profile.last_name}</Text>
          {profile.headline ? <Text style={dynamicTitle}>{profile.headline}</Text> : null}

          <Text style={modernStyles.sideTitle}>İLETİŞİM</Text>
          <View>
            <Text style={modernStyles.sideLabel}>E-POSTA</Text>
            <Text style={modernStyles.sideText}>{profile.edu_email}</Text>
          </View>
          {profile.phone ? (
            <View>
              <Text style={modernStyles.sideLabel}>TELEFON</Text>
              <Text style={modernStyles.sideText}>{profile.phone}</Text>
            </View>
          ) : null}
          {profile.location ? (
            <View>
              <Text style={modernStyles.sideLabel}>KONUM</Text>
              <Text style={modernStyles.sideText}>{profile.location}</Text>
            </View>
          ) : null}
          {profile.website_url ? (
            <View>
              <Text style={modernStyles.sideLabel}>WEB</Text>
              <Text style={modernStyles.sideText}>{formatUrlLabel(profile.website_url)}</Text>
            </View>
          ) : null}
          {profile.linkedin_url ? (
            <View>
              <Text style={modernStyles.sideLabel}>LINKEDIN</Text>
              <Text style={modernStyles.sideText}>{formatUrlLabel(profile.linkedin_url)}</Text>
            </View>
          ) : null}
          {profile.github_url ? (
            <View>
              <Text style={modernStyles.sideLabel}>GITHUB</Text>
              <Text style={modernStyles.sideText}>{formatUrlLabel(profile.github_url)}</Text>
            </View>
          ) : null}

          {skills.length > 0 ? (
            <View>
              <Text style={modernStyles.sideTitle}>YETENEKLER</Text>
              {skills.map((s, i) => (
                <Text key={i} style={modernStyles.sideSkillText}>• {s}</Text>
              ))}
            </View>
          ) : null}

          {languages.length > 0 ? (
            <View>
              <Text style={modernStyles.sideTitle}>DİLLER</Text>
              {languages.map((l, i) => (
                <Text key={i} style={modernStyles.sideSkillText}>• {l.language || (l as any).name} ({l.level})</Text>
              ))}
            </View>
          ) : null}

          {references.length > 0 ? (
            <View>
              <Text style={modernStyles.sideTitle}>REFERANSLAR</Text>
              {references.map((ref, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <Text style={[modernStyles.sideText, { fontWeight: 'bold', color: '#ffffff', marginBottom: 0 }]}>{ref.name}</Text>
                  <Text style={modernStyles.sideSkillText}>{[ref.position || (ref as any).title, ref.company].filter(Boolean).join(', ')}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Sağ Ana İçerik (doğal akışta, birden fazla sayfaya doğru şekilde bölünür) */}
        {profile.bio ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={modernStyles.mainSectionTitle}>ÖZET</Text>
            <Text style={modernStyles.cardDesc}>{profile.bio}</Text>
          </View>
        ) : null}

        {experience.length > 0 ? (
          <View>
            <Text style={modernStyles.mainSectionTitle}>DENEYİMLER</Text>
            {experience.map((exp, i) => (
              <View key={i} style={dynamicCard} wrap={false}>
                <Text style={modernStyles.cardTitle}>{exp.title || (exp as any).position} @ {exp.company}</Text>
                <Text style={modernStyles.cardDate}>{formatDateRange(exp.startDate || (exp as any).start_date, exp.endDate || (exp as any).end_date, exp.current)}{exp.location ? `  •  ${exp.location}` : ''}</Text>
                {exp.description ? <Text style={modernStyles.cardDesc}>{exp.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {education.length > 0 ? (
          <View>
            <Text style={modernStyles.mainSectionTitle}>EĞİTİM</Text>
            {education.map((edu, i) => (
              <View key={i} style={dynamicCard} wrap={false}>
                <Text style={modernStyles.cardTitle}>{edu.school}</Text>
                <Text style={modernStyles.cardDate}>{[edu.degree, edu.field].filter(Boolean).join(' - ')} ({formatDateRange(edu.startDate || (edu as any).start_date, edu.endDate || (edu as any).end_date, edu.current)})</Text>
              </View>
            ))}
          </View>
        ) : null}

        {projects.length > 0 ? (
          <View>
            <Text style={modernStyles.mainSectionTitle}>PROJELER</Text>
            {projects.map((p, i) => (
              <View key={i} style={dynamicCard} wrap={false}>
                <Text style={modernStyles.cardTitle}>{p.title}</Text>
                {p.description ? <Text style={modernStyles.cardDesc}>{p.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {certifications.length > 0 ? (
          <View>
            <Text style={modernStyles.mainSectionTitle}>SERTİFİKALAR</Text>
            {certifications.map((cert, i) => (
              <View key={i} style={modernStyles.simpleRow}>
                <Text style={modernStyles.cardSub}>{cert.name} — {cert.issuer}</Text>
                <Text style={modernStyles.cardDate}>{cert.date || (cert as any).issue_date}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {customSections.filter((s) => s.title && s.items?.length > 0).map((section, i) => (
          <View key={i}>
            <Text style={modernStyles.mainSectionTitle}>{section.title.toUpperCase()}</Text>
            {section.items.map((item, ii) => (
              <Text key={ii} style={modernStyles.cardDesc}>• {item}</Text>
            ))}
          </View>
        ))}

        <Text style={modernStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

// ----------------------------------------------------
// 4. AKADEMİK / ATS SADE ŞABLON (Tek Kolon, Minimal Siyah-Beyaz)
//
// Düzeltilen sorunlar:
//  - exp.position artık var olmayan bir alan; deneyim başlıkları boş
//    görünüyordu. exp.title (+ eski veri için .position yedeği) kullanılıyor.
//  - languages prop olarak alınıyordu ama hiçbir yerde gösterilmiyordu; Diller
//    bölümü eklendi. Sertifikalar ve Özel Bölümler de tamamen eksikti; eklendi.
//  - Bu şablon zaten tek sütun ve renksiz/ikonsuz olduğu için ATS'e uygunluğu
//    korunuyor; sadece sayfa numarası eklenerek diğer şablonlarla tutarlı hale
//    getirildi.
// ----------------------------------------------------
const academicStyles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 55,
    fontFamily: 'Roboto',
    fontSize: 9,
    lineHeight: 1.5,
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    color: '#333333',
  },
  contact: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    fontSize: 8,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginTop: 10,
    marginBottom: 6,
    paddingBottom: 2,
    letterSpacing: 0.5,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bold: {
    fontWeight: 'bold',
  },
  // NOT: 'Roboto' fontu için italik varyant kayıtlı değil (bkz. Font.register
  // üstte); fontStyle:'italic' kullanmak react-pdf'in "Could not resolve font"
  // hatasıyla TÜM PDF üretimini çökertiyordu (eğitim/deneyim bilgisi olan her
  // kullanıcı için). Bunun yerine renkle ayrıştırılıyor.
  subtle: {
    color: '#4b5563',
  },
  text: {
    fontSize: 8.5,
    color: '#111111',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    right: 40,
    color: '#333333',
  },
});

function AcademicTemplate({ profile, skills, education, experience, certifications = [], languages = [], projects = [], references = [], customSections = [] }: CvPdfProps) {
  const contactParts = [
    profile.edu_email,
    profile.phone,
    profile.location,
    profile.website_url ? formatUrlLabel(profile.website_url) : null,
    profile.linkedin_url ? formatUrlLabel(profile.linkedin_url) : null,
    profile.github_url ? formatUrlLabel(profile.github_url) : null,
  ].filter(Boolean) as string[];

  return (
    <Document>
      <Page size="A4" style={academicStyles.page} wrap={true}>
        <View style={academicStyles.header}>
          <Text style={academicStyles.name}>{profile.first_name} {profile.last_name}</Text>
          {profile.headline ? <Text style={academicStyles.title}>{profile.headline}</Text> : null}
          <View style={academicStyles.contact}>
            {contactParts.map((part, i) => (
              <Text key={i}>{i > 0 ? '|  ' : ''}{part}</Text>
            ))}
          </View>
        </View>

        {profile.bio ? (
          <View>
            <Text style={academicStyles.sectionTitle}>AKADEMİK & PROFESYONEL ÖZET</Text>
            <Text style={academicStyles.text}>{profile.bio}</Text>
          </View>
        ) : null}

        {education.length > 0 ? (
          <View>
            <Text style={academicStyles.sectionTitle}>EĞİTİM BİLGİLERİ</Text>
            {education.map((edu, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={academicStyles.rowHeader}>
                  <Text style={academicStyles.bold}>{edu.school}</Text>
                  <Text>{formatDateRange(edu.startDate || (edu as any).start_date, edu.endDate || (edu as any).end_date, edu.current)}</Text>
                </View>
                <Text style={academicStyles.subtle}>{[edu.degree, edu.field].filter(Boolean).join(' - ')}{edu.gpa ? `  •  Not Ortalaması: ${edu.gpa}` : ''}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {experience.length > 0 ? (
          <View>
            <Text style={academicStyles.sectionTitle}>DENEYİM VE AKADEMİK GÖREVLER</Text>
            {experience.map((exp, i) => (
              <View key={i} style={{ marginBottom: 6 }} wrap={false}>
                <View style={academicStyles.rowHeader}>
                  <Text style={academicStyles.bold}>{exp.title || (exp as any).position} — {exp.company}</Text>
                  <Text>{formatDateRange(exp.startDate || (exp as any).start_date, exp.endDate || (exp as any).end_date, exp.current)}</Text>
                </View>
                {exp.location ? <Text style={academicStyles.subtle}>{exp.location}</Text> : null}
                {exp.description ? <Text style={academicStyles.text}>{exp.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {projects.length > 0 ? (
          <View>
            <Text style={academicStyles.sectionTitle}>PROJELER VE YAYINLAR</Text>
            {projects.map((p, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                <Text style={academicStyles.bold}>{p.title}</Text>
                {p.description ? <Text style={academicStyles.text}>{p.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {skills.length > 0 ? (
          <View>
            <Text style={academicStyles.sectionTitle}>TEKNİK YETKİNLİKLER</Text>
            <Text style={academicStyles.text}>{skills.join(', ')}</Text>
          </View>
        ) : null}

        {languages.length > 0 ? (
          <View>
            <Text style={academicStyles.sectionTitle}>YABANCI DİLLER</Text>
            <Text style={academicStyles.text}>
              {languages.map((l) => `${l.language || (l as any).name} (${l.level})`).join('  •  ')}
            </Text>
          </View>
        ) : null}

        {certifications.length > 0 ? (
          <View>
            <Text style={academicStyles.sectionTitle}>SERTİFİKALAR VE EĞİTİMLER</Text>
            {certifications.map((cert, i) => (
              <View key={i} style={academicStyles.rowHeader}>
                <Text style={academicStyles.text}>{cert.name} — {cert.issuer}</Text>
                <Text style={academicStyles.text}>{cert.date || (cert as any).issue_date}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {references.length > 0 ? (
          <View>
            <Text style={academicStyles.sectionTitle}>AKADEMİK / SEKTÖREL REFERANSLAR</Text>
            {references.map((r, i) => (
              <Text key={i} style={academicStyles.text}>• {r.name} — {r.position || (r as any).title}, {r.company} ({(r as any).contact || [r.email, r.phone].filter(Boolean).join(" • ")})</Text>
            ))}
          </View>
        ) : null}

        {customSections.filter((s) => s.title && s.items?.length > 0).map((section, i) => (
          <View key={i}>
            <Text style={academicStyles.sectionTitle}>{section.title.toUpperCase()}</Text>
            {section.items.map((item, ii) => (
              <Text key={ii} style={academicStyles.text}>• {item}</Text>
            ))}
          </View>
        ))}

        <Text style={academicStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

// ----------------------------------------------------
// DİNAMİK PDF YÖNETİCİSİ (Export Edilen Ana Bileşen)
// ----------------------------------------------------
export function CvPdf(props: CvPdfProps) {
  const template = props.templateName || 'standard';

  switch (template) {
    case 'corporate':
      return <CorporateTemplate {...props} />;
    case 'modern':
      return <ModernTemplate {...props} />;
    case 'academic':
      return <AcademicTemplate {...props} />;
    case 'standard':
    default:
      return <StandardTemplate {...props} />;
  }
}
