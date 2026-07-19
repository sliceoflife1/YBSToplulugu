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

const PRIMARY_COLOR = '#0ea5e9'; // Profesyonel mavi tonu

// SVG Vektör İkonları (react-pdf uyumlu)
const PinIcon = () => (
  <Svg width="8" height="8" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#cbd5e1" />
  </Svg>
);

const PhoneIcon = () => (
  <Svg width="8" height="8" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
    <Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#cbd5e1" />
  </Svg>
);

const MailIcon = () => (
  <Svg width="8" height="8" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
    <Path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#cbd5e1" />
  </Svg>
);

const LinkIcon = () => (
  <Svg width="8" height="8" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
    <Path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="#0ea5e9" />
  </Svg>
);

const styles = StyleSheet.create({
  page: {
    paddingLeft: 190, // Sol sütun genişliği + boşluk
    paddingRight: 25,
    paddingTop: 30,
    paddingBottom: 50,
    fontFamily: 'Roboto',
    fontSize: 9,
    lineHeight: 1.4,
    color: '#333333',
    backgroundColor: '#ffffff',
  },
  
  // Sol Sütun (Sabit Sidebar)
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 165,
    backgroundColor: '#202d3d',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingTop: 30,
    paddingBottom: 30,
  },

  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    borderBottomWidth: 1.2,
    borderBottomColor: '#ffffff',
    paddingBottom: 3,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  sidebarText: {
    fontSize: 7.5,
    color: '#cbd5e1',
    lineHeight: 1.3,
  },
  sidebarTextBold: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  sidebarDate: {
    fontSize: 7,
    color: '#94a3b8',
    marginBottom: 4,
  },
  sidebarBullet: {
    fontSize: 7.5,
    color: '#cbd5e1',
    marginBottom: 3,
    paddingLeft: 4,
  },
  sidebarLink: {
    color: PRIMARY_COLOR,
    textDecoration: 'none',
    fontSize: 7.5,
  },

  // Üst Bilgi (Header)
  mainHeaderContainer: {
    marginBottom: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: '#111111',
    paddingBottom: 8,
    flexDirection: 'column',
  },
  mainName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 1.1,
    marginBottom: 2,
  },
  mainTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    lineHeight: 1.2,
  },

  // Bölüm Başlıkları
  mainSection: {
    marginBottom: 15,
  },
  mainSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    borderBottomWidth: 1.5,
    borderBottomColor: '#111111',
    paddingBottom: 3,
    marginBottom: 8,
    marginTop: 8,
  },

  // Hakkımda
  mainBioText: {
    fontSize: 8.5,
    lineHeight: 1.4,
    color: '#374151',
    textAlign: 'justify',
  },

  // Deneyim & Eğitim Detayları
  mainItemGroup: {
    marginBottom: 10,
  },
  mainItemDate: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 1,
  },
  mainItemSubtitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 1,
  },
  mainItemTitle: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 3,
  },
  mainItemLocation: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 3,
  },
  mainItemDescription: {
    fontSize: 8.5,
    color: '#4b5563',
    lineHeight: 1.3,
  },
  mainItemBullet: {
    fontSize: 8.5,
    color: '#374151',
    paddingLeft: 6,
    marginBottom: 1,
    lineHeight: 1.3,
  },
  mainItemLink: {
    color: PRIMARY_COLOR,
    textDecoration: 'none',
    fontSize: 8,
    marginTop: 2,
  },

  // Çoklu sayfa üst isim tekrarı
  pageHeader: {
    position: 'absolute',
    fontSize: 8,
    top: 15,
    left: 190,
    right: 25,
    color: '#94a3b8',
    textAlign: 'right',
    letterSpacing: 0.5,
  },

  // Sayfa Numarası
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    left: 190,
    right: 25,
    textAlign: 'center',
    color: '#94a3b8',
  },
});

function getLanguageLevelLabel(level: string) {
  switch (level) {
    case "beginner": return "Başlangıç";
    case "intermediate": return "Orta";
    case "advanced": return "İleri";
    case "native": return "Anadil";
    default: return level;
  }
}

function renderContact(profile: Profile) {
  return (
    <View style={styles.sidebarSection} wrap={false}>
      <Text style={styles.sidebarTitle}>İLETİŞİM</Text>
      {profile.location && (
        <View style={styles.contactRow}>
          <PinIcon />
          <Text style={styles.sidebarText}>{profile.location}</Text>
        </View>
      )}
      {profile.phone && (
        <View style={styles.contactRow}>
          <PhoneIcon />
          <Text style={styles.sidebarText}>{profile.phone}</Text>
        </View>
      )}
      {profile.edu_email && (
        <View style={styles.contactRow}>
          <MailIcon />
          <Text style={styles.sidebarText}>{profile.edu_email}</Text>
        </View>
      )}
      {profile.personal_email && profile.personal_email !== profile.edu_email && (
        <View style={styles.contactRow}>
          <MailIcon />
          <Text style={styles.sidebarText}>{profile.personal_email}</Text>
        </View>
      )}
      {profile.linkedin_url && (
        <View style={styles.contactRow}>
          <LinkIcon />
          <Link src={profile.linkedin_url} style={styles.sidebarLink}>LinkedIn</Link>
        </View>
      )}
      {profile.github_url && (
        <View style={styles.contactRow}>
          <LinkIcon />
          <Link src={profile.github_url} style={styles.sidebarLink}>GitHub</Link>
        </View>
      )}
      {profile.website_url && (
        <View style={styles.contactRow}>
          <LinkIcon />
          <Link src={profile.website_url} style={styles.sidebarLink}>Web Sitesi</Link>
        </View>
      )}
    </View>
  );
}

function renderSidebarEducation(education: CvEducation[]) {
  if (!education || education.length === 0) return null;
  return (
    <View style={styles.sidebarSection} wrap={false}>
      <Text style={styles.sidebarTitle}>EĞİTİM</Text>
      {education.map((edu, i) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <Text style={styles.sidebarTextBold}>{edu.school}</Text>
          <Text style={styles.sidebarText}>{[edu.degree, edu.field].filter(Boolean).join(" - ")}</Text>
          {edu.gpa && <Text style={styles.sidebarText}>Not Ortalaması: {edu.gpa}</Text>}
          <Text style={styles.sidebarDate}>{formatDateRange(edu.startDate, edu.endDate, edu.current, false)}</Text>
        </View>
      ))}
    </View>
  );
}

function renderSidebarSkills(skills: string[]) {
  if (!skills || skills.length === 0) return null;
  return (
    <View style={styles.sidebarSection} wrap={false}>
      <Text style={styles.sidebarTitle}>YETENEKLER</Text>
      {skills.map((skill, i) => (
        <Text key={i} style={styles.sidebarBullet}>•  {skill}</Text>
      ))}
    </View>
  );
}

function renderSidebarLanguages(languages: CvLanguage[]) {
  if (!languages || languages.length === 0) return null;
  return (
    <View style={styles.sidebarSection} wrap={false}>
      <Text style={styles.sidebarTitle}>YABANCI DİLLER</Text>
      {languages.map((lang, i) => (
        <Text key={i} style={styles.sidebarBullet}>•  {lang.language} ({getLanguageLevelLabel(lang.level)})</Text>
      ))}
    </View>
  );
}

function renderMainHeader(profile: Profile) {
  const name = `${profile.first_name || ''} ${profile.last_name || ''}`.toLocaleUpperCase('tr-TR');
  const headline = profile.headline || profile.department || "Yönetim Bilişim Sistemleri Öğrencisi";
  return (
    <View style={styles.mainHeaderContainer} wrap={false}>
      <Text style={styles.mainName}>{name}</Text>
      <Text style={styles.mainTitle}>{headline}</Text>
    </View>
  );
}

function renderMainBio(bio: string | null) {
  if (!bio) return null;
  return (
    <View style={styles.mainSection} wrap={false}>
      <Text style={styles.mainSectionTitle}>HAKKIMDA</Text>
      <Text style={styles.mainBioText}>{bio}</Text>
    </View>
  );
}

function renderMainExperience(experience: CvExperience[]) {
  if (!experience || experience.length === 0) return null;
  return (
    <View style={styles.mainSection}>
      <Text style={styles.mainSectionTitle}>DENEYİM</Text>
      {experience.map((exp, i) => (
        <View key={i} style={styles.mainItemGroup} wrap={false}>
          <Text style={styles.mainItemDate}>{formatDateRange(exp.startDate, exp.endDate, exp.current, false)}</Text>
          <Text style={styles.mainItemSubtitle}>{exp.company}</Text>
          <Text style={styles.mainItemTitle}>{exp.title}</Text>
          {exp.location ? <Text style={styles.mainItemLocation}>{exp.location}</Text> : null}
          {exp.description
            ? exp.description.split("\n").filter(Boolean).map((line, li) => (
                <Text key={li} style={styles.mainItemBullet}>• {line}</Text>
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

function renderMainProjects(projects: CvProject[]) {
  if (!projects || projects.length === 0) return null;
  return (
    <View style={styles.mainSection}>
      <Text style={styles.mainSectionTitle}>PROJELER</Text>
      {projects.map((proj, i) => (
        <View key={i} style={styles.mainItemGroup} wrap={false}>
          <Text style={styles.mainItemDate}>{proj.date}</Text>
          <Text style={styles.mainItemSubtitle}>{proj.title}</Text>
          {proj.description ? <Text style={styles.mainItemDescription}>{proj.description}</Text> : null}
          {proj.technologies && proj.technologies.length > 0 && (
            <Text style={[styles.mainItemDescription, { marginTop: 2, fontWeight: 'bold' }]}>Araçlar: {proj.technologies.join(", ")}</Text>
          )}
          {proj.url ? <Link src={proj.url} style={styles.mainItemLink}>{proj.url}</Link> : null}
        </View>
      ))}
    </View>
  );
}

function renderMainCertifications(certifications: CvCertification[]) {
  if (!certifications || certifications.length === 0) return null;
  return (
    <View style={styles.mainSection}>
      <Text style={styles.mainSectionTitle}>SERTİFİKALAR</Text>
      {certifications.map((cert, i) => (
        <View key={i} style={styles.mainItemGroup} wrap={false}>
          <Text style={styles.mainItemDate}>{cert.date}</Text>
          <Text style={styles.mainItemSubtitle}>{cert.name}</Text>
          <Text style={styles.mainItemTitle}>{cert.issuer}</Text>
          {cert.url ? <Link src={cert.url} style={styles.mainItemLink}>Doğrula</Link> : null}
        </View>
      ))}
    </View>
  );
}

function renderMainReferences(references: CvReference[]) {
  if (!references || references.length === 0) return null;
  return (
    <View style={styles.mainSection}>
      <Text style={styles.mainSectionTitle}>REFERANSLAR</Text>
      {references.map((ref, i) => (
        <View key={i} style={styles.mainItemGroup} wrap={false}>
          <Text style={styles.mainItemSubtitle}>{ref.name}</Text>
          {(ref.position || ref.company) && (
            <Text style={styles.mainItemTitle}>{[ref.position, ref.company].filter(Boolean).join(" - ")}</Text>
          )}
          {(ref.email || ref.phone) && (
            <Text style={styles.mainItemDescription}>{[ref.email, ref.phone].filter(Boolean).join(" • ")}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function renderMainCustomSections(customSections: CvCustomSection[]) {
  if (!customSections || customSections.length === 0) return null;
  return (
    <>
      {customSections.map((section, i) => (
        section.title && section.items && section.items.length > 0 ? (
          <View key={i} style={styles.mainSection}>
            <Text style={styles.mainSectionTitle}>{section.title.toLocaleUpperCase('tr-TR')}</Text>
            {section.items.map((item, ii) => (
              <Text key={ii} style={styles.mainItemBullet} wrap={false}>• {item}</Text>
            ))}
          </View>
        ) : null
      ))}
    </>
  );
}

interface CvPdfProps {
  profile: Profile;
  cvData: CvData | null;
  skills: string[];
  education: CvEducation[];
  experience: CvExperience[];
  certifications?: CvCertification[];
  languages?: CvLanguage[];
  projects?: CvProject[];
  references?: CvReference[];
  customSections?: CvCustomSection[];
  // Legacy props
  templateName?: string;
  primaryColor?: string;
}

export function CvPdf({
  profile,
  skills,
  education,
  experience,
  certifications = [],
  languages = [],
  projects = [],
  references = [],
  customSections = []
}: CvPdfProps) {
  
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={true}>
        
        {/* Sol Sütun - Sidebar (Her sayfada sabit) */}
        <View style={styles.sidebar} fixed>
          {profile.avatar_url ? (
            <View style={styles.avatarContainer}>
              <Image src={profile.avatar_url} style={styles.avatar} />
            </View>
          ) : null}

          {renderContact(profile)}
          {renderSidebarEducation(education)}
          {renderSidebarSkills(skills)}
          {renderSidebarLanguages(languages)}
        </View>

        {/* Üst Bilgi İsmi (2. sayfadan itibaren görünür) */}
        <Text style={styles.pageHeader} render={({ pageNumber }) => (
          pageNumber > 1 ? `${profile.first_name} ${profile.last_name}` : ''
        )} fixed />

        {/* Ana İçerik */}
        {renderMainHeader(profile)}
        {renderMainBio(profile.bio)}
        {renderMainExperience(experience)}
        {renderMainProjects(projects)}
        {renderMainCertifications(certifications)}
        {renderMainReferences(references)}
        {renderMainCustomSections(customSections)}

        {/* Sayfa numaraları: 1 / 2 formatında */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
}
