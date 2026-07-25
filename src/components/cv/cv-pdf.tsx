import { Document, Page, Text, View, StyleSheet, Font, Link, Image, Svg, Path } from '@react-pdf/renderer';
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
// 2. KURUMSAL / KLASİK ŞABLON (Tek Kolon, Çizgili)
// ----------------------------------------------------
const corporateStyles = StyleSheet.create({
  page: {
    padding: 35,
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
    gap: 12,
    marginTop: 6,
    fontSize: 8,
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e3a8a',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
    marginTop: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
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
  gridTwoCol: {
    flexDirection: 'row',
    gap: 20,
  },
  col: {
    flex: 1,
  },
  badge: {
    fontSize: 8,
    color: '#1e293b',
    marginBottom: 3,
  }
});

function CorporateTemplate({ profile, skills, education, experience, certifications = [], languages = [], projects = [], references = [], primaryColor = '#1e3a8a' }: CvPdfProps) {
  const dynamicHeader = [corporateStyles.header, { borderBottomColor: primaryColor }];
  const dynamicName = [corporateStyles.name, { color: primaryColor }];
  const dynamicSection = [corporateStyles.sectionTitle, { color: primaryColor }];

  return (
    <Document>
      <Page size="A4" style={corporateStyles.page} wrap={true}>
        <View style={dynamicHeader}>
          <Text style={dynamicName}>{profile.first_name} {profile.last_name}</Text>
          {profile.headline ? <Text style={corporateStyles.headline}>{profile.headline}</Text> : null}
          <View style={corporateStyles.contactBar}>
            <Text>✉️ {profile.edu_email}</Text>
            {profile.phone ? <Text>📞 {profile.phone}</Text> : null}
            {profile.location ? <Text>📍 {profile.location}</Text> : null}
            {profile.website_url ? <Text>🌐 {formatUrlLabel(profile.website_url)}</Text> : null}
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
              <View key={i} style={{ marginBottom: 8 }}>
                <View style={corporateStyles.itemHeader}>
                  <Text style={corporateStyles.itemTitle}>{exp.position} — {exp.company}</Text>
                  <Text style={{ fontSize: 8, color: '#64748b' }}>{formatDateRange(exp.startDate || (exp as any).start_date, exp.endDate || (exp as any).end_date, exp.current)}</Text>
                </View>
                <Text style={corporateStyles.itemSub}>{exp.location || 'İzmir'}</Text>
                {exp.description ? <Text style={corporateStyles.desc}>{exp.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        <View style={corporateStyles.gridTwoCol}>
          <View style={corporateStyles.col}>
            {education.length > 0 ? (
              <View>
                <Text style={dynamicSection}>EĞİTİM GEÇMİŞİ</Text>
                {education.map((edu, i) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    <Text style={corporateStyles.itemTitle}>{edu.school}</Text>
                    <Text style={corporateStyles.itemSub}>{edu.degree} - {edu.field}</Text>
                    <Text style={{ fontSize: 7.5, color: '#64748b' }}>{formatDateRange(edu.startDate || (edu as any).start_date, edu.endDate || (edu as any).end_date, edu.current)}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {skills.length > 0 ? (
              <View>
                <Text style={dynamicSection}>UZMANLIK VE YETENEKLER</Text>
                {skills.map((s, i) => (
                  <Text key={i} style={corporateStyles.badge}>• {s}</Text>
                ))}
              </View>
            ) : null}
          </View>

          <View style={corporateStyles.col}>
            {projects.length > 0 ? (
              <View>
                <Text style={dynamicSection}>PROJELER VE BAŞARILAR</Text>
                {projects.map((p, i) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    <Text style={corporateStyles.itemTitle}>{p.title}</Text>
                    {p.description ? <Text style={corporateStyles.desc}>{p.description}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}

            {languages.length > 0 ? (
              <View>
                <Text style={dynamicSection}>YABANCI DİLLER</Text>
                {languages.map((l, i) => (
                  <Text key={i} style={corporateStyles.badge}>• {l.language || (l as any).name} ({l.level})</Text>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ----------------------------------------------------
// 3. MODERN / MİNİMALİST ŞABLON (2 Kolon, Renkli Kartlar)
// ----------------------------------------------------
const modernStyles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    fontFamily: 'Roboto',
    fontSize: 8.5,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  leftSide: {
    width: '32%',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: 20,
  },
  rightSide: {
    width: '68%',
    padding: 24,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
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
  },
  sideText: {
    fontSize: 7.5,
    color: '#94a3b8',
    marginBottom: 3,
  },
  mainSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 8,
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
  cardDate: {
    fontSize: 7.5,
    color: '#64748b',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 8,
    color: '#334155',
  }
});

function ModernTemplate({ profile, skills, education, experience, projects = [], languages = [], primaryColor = '#0ea5e9' }: CvPdfProps) {
  const dynamicTitle = [modernStyles.title, { color: primaryColor }];
  const dynamicCard = [modernStyles.card, { borderLeftColor: primaryColor }];

  return (
    <Document>
      <Page size="A4" style={modernStyles.page} wrap={true}>
        <View style={modernStyles.leftSide}>
          <Text style={modernStyles.name}>{profile.first_name} {profile.last_name}</Text>
          {profile.headline ? <Text style={dynamicTitle}>{profile.headline}</Text> : null}

          <Text style={modernStyles.sideTitle}>İLETİŞİM</Text>
          <Text style={modernStyles.sideText}>✉️ {profile.edu_email}</Text>
          {profile.phone ? <Text style={modernStyles.sideText}>📞 {profile.phone}</Text> : null}
          {profile.location ? <Text style={modernStyles.sideText}>📍 {profile.location}</Text> : null}
          {profile.website_url ? <Text style={modernStyles.sideText}>🌐 {formatUrlLabel(profile.website_url)}</Text> : null}

          {skills.length > 0 ? (
            <View>
              <Text style={modernStyles.sideTitle}>YETENEKLER</Text>
              {skills.map((s, i) => (
                <Text key={i} style={modernStyles.sideText}>• {s}</Text>
              ))}
            </View>
          ) : null}

          {languages.length > 0 ? (
            <View>
              <Text style={modernStyles.sideTitle}>DİLLER</Text>
              {languages.map((l, i) => (
                <Text key={i} style={modernStyles.sideText}>• {l.language || (l as any).name} ({l.level})</Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={modernStyles.rightSide}>
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
                <View key={i} style={dynamicCard}>
                  <Text style={modernStyles.cardTitle}>{exp.position} @ {exp.company}</Text>
                  <Text style={modernStyles.cardDate}>{formatDateRange(exp.startDate || (exp as any).start_date, exp.endDate || (exp as any).end_date, exp.current)}</Text>
                  {exp.description ? <Text style={modernStyles.cardDesc}>{exp.description}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}

          {education.length > 0 ? (
            <View>
              <Text style={modernStyles.mainSectionTitle}>EĞİTİM</Text>
              {education.map((edu, i) => (
                <View key={i} style={dynamicCard}>
                  <Text style={modernStyles.cardTitle}>{edu.school}</Text>
                  <Text style={modernStyles.cardDate}>{edu.degree} - {edu.field} ({formatDateRange(edu.startDate || (edu as any).start_date, edu.endDate || (edu as any).end_date, edu.current)})</Text>
                </View>
              ))}
            </View>
          ) : null}

          {projects.length > 0 ? (
            <View>
              <Text style={modernStyles.mainSectionTitle}>PROJELER</Text>
              {projects.map((p, i) => (
                <View key={i} style={dynamicCard}>
                  <Text style={modernStyles.cardTitle}>{p.title}</Text>
                  {p.description ? <Text style={modernStyles.cardDesc}>{p.description}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

// ----------------------------------------------------
// 4. AKADEMİK / ATS SADE ŞABLON (Tek Kolon, Minimal Siyah-Beyaz)
// ----------------------------------------------------
const academicStyles = StyleSheet.create({
  page: {
    padding: 40,
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
    fontStyle: 'italic',
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
  italic: {
    fontStyle: 'italic',
  },
  text: {
    fontSize: 8.5,
    color: '#111111',
  }
});

function AcademicTemplate({ profile, skills, education, experience, projects = [], languages = [], references = [] }: CvPdfProps) {
  return (
    <Document>
      <Page size="A4" style={academicStyles.page} wrap={true}>
        <View style={academicStyles.header}>
          <Text style={academicStyles.name}>{profile.first_name} {profile.last_name}</Text>
          {profile.headline ? <Text style={academicStyles.title}>{profile.headline}</Text> : null}
          <View style={academicStyles.contact}>
            <Text>{profile.edu_email}</Text>
            {profile.phone ? <Text>|  {profile.phone}</Text> : null}
            {profile.location ? <Text>|  {profile.location}</Text> : null}
            {profile.website_url ? <Text>|  {formatUrlLabel(profile.website_url)}</Text> : null}
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
                <Text style={academicStyles.italic}>{edu.degree} - {edu.field}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {experience.length > 0 ? (
          <View>
            <Text style={academicStyles.sectionTitle}>DENEYİM VE AKADEMİK GÖREVLER</Text>
            {experience.map((exp, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={academicStyles.rowHeader}>
                  <Text style={academicStyles.bold}>{exp.position} — {exp.company}</Text>
                  <Text>{formatDateRange(exp.startDate || (exp as any).start_date, exp.endDate || (exp as any).end_date, exp.current)}</Text>
                </View>
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

        {references.length > 0 ? (
          <View>
            <Text style={academicStyles.sectionTitle}>AKADEMİK / SEKTÖREL REFERANSLAR</Text>
            {references.map((r, i) => (
              <Text key={i} style={academicStyles.text}>• {r.name} — {r.position || (r as any).title}, {r.company} ({(r as any).contact || [r.email, r.phone].filter(Boolean).join(" • ")})</Text>
            ))}
          </View>
        ) : null}
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
