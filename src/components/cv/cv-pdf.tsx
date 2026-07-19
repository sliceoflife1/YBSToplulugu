import { Document, Page, Text, View, StyleSheet, Font, Link, Image } from '@react-pdf/renderer';
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

const PRIMARY_COLOR = '#0ea5e9'; // Profesyonel bir mavi tonu (Tailwind sky-500)

const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 50, // Sayfa numarası için altta boşluk
    paddingHorizontal: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#111111',
    backgroundColor: '#ffffff',
  },
  
  // Çoklu sayfa üst isim tekrarı
  pageHeader: {
    fontSize: 9,
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Üst Bilgi (Header)
  header: {
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    paddingBottom: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
    lineHeight: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    fontSize: 9,
    color: '#444444',
  },
  contactItem: {
    marginRight: 12,
  },
  link: {
    color: '#444444',
    textDecoration: 'none',
  },
  linkHighlight: {
    color: PRIMARY_COLOR,
    textDecoration: 'none',
  },

  // Bölüm Başlıkları
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    paddingBottom: 4,
    marginBottom: 10,
    marginTop: 18,
  },

  // Hakkımda (Bio)
  bioText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333333',
    textAlign: 'justify',
  },

  // Listeleme Öğeleri (Eğitim, Deneyim vb.)
  itemGroup: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 10.5,
    color: '#000000',
    flex: 1,
    paddingRight: 10,
  },
  itemDate: {
    fontSize: 9.5,
    color: '#555555',
    textAlign: 'right',
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#333333',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  itemLocation: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 9.5,
    color: '#444444',
    lineHeight: 1.4,
  },
  itemDescriptionLine: {
    fontSize: 9.5,
    color: '#444444',
    lineHeight: 1.4,
    marginBottom: 2,
    paddingLeft: 6,
  },

  // Yetenekler
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  skillBadge: {
    borderWidth: 1,
    borderColor: '#cccccc',
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 9,
    marginRight: 6,
    marginBottom: 6,
    color: '#333333',
    borderRadius: 2,
  },

  // Diller & Referanslar vb.
  simpleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  simpleItemLeft: {
    fontWeight: 'bold',
    fontSize: 10,
    color: '#000000',
  },
  simpleItemRight: {
    color: '#555555',
    fontSize: 10,
  },
  
  referenceBlock: {
    marginBottom: 8,
  },
  referenceName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  referenceMeta: {
    fontSize: 9.5,
    color: '#555555',
    marginTop: 1,
  },
  
  customSectionItem: {
    fontSize: 9.5,
    color: '#333333',
    marginBottom: 3,
    paddingLeft: 6,
  },

  // Sayfa Numarası
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 25,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#888888',
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

function renderHeader(profile: Profile) {
  return (
    <View style={styles.header} wrap={false}>
      <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
      <Text style={styles.title}>{profile.headline || profile.department || "Yönetim Bilişim Sistemleri Öğrencisi"}</Text>
      <View style={styles.contactRow}>
        {profile.location && <Text style={styles.contactItem}>{profile.location}</Text>}
        {profile.edu_email && <Text style={styles.contactItem}>{profile.edu_email}</Text>}
        {profile.phone && <Text style={styles.contactItem}>{profile.phone}</Text>}
        {profile.personal_email && profile.personal_email !== profile.edu_email && (
          <Text style={styles.contactItem}>{profile.personal_email}</Text>
        )}
        {profile.linkedin_url && <Link src={profile.linkedin_url} style={[styles.contactItem, styles.linkHighlight]}>LinkedIn</Link>}
        {profile.github_url && <Link src={profile.github_url} style={[styles.contactItem, styles.linkHighlight]}>GitHub</Link>}
        {profile.website_url && <Link src={profile.website_url} style={[styles.contactItem, styles.linkHighlight]}>Web Sitesi</Link>}
      </View>
    </View>
  );
}

function renderBio(bio: string | null) {
  if (!bio) return null;
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Hakkımda</Text>
      <Text style={styles.bioText}>{bio}</Text>
    </View>
  );
}

function renderExperience(experience: CvExperience[]) {
  if (!experience || experience.length === 0) return null;
  return (
    <View wrap={true}>
      <Text style={styles.sectionTitle}>Deneyim</Text>
      {experience.map((exp, i) => (
        <View key={i} style={styles.itemGroup} wrap={false}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{exp.title}</Text>
            <Text style={styles.itemDate}>{formatDateRange(exp.startDate, exp.endDate, exp.current, false)}</Text>
          </View>
          <Text style={styles.itemSubtitle}>{exp.company}</Text>
          {exp.location ? <Text style={styles.itemLocation}>{exp.location}</Text> : null}
          {exp.description
            ? exp.description.split("\n").filter(Boolean).map((line, li) => (
                <Text key={li} style={styles.itemDescriptionLine}>• {line}</Text>
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

function renderEducation(education: CvEducation[]) {
  if (!education || education.length === 0) return null;
  return (
    <View wrap={true}>
      <Text style={styles.sectionTitle}>Eğitim</Text>
      {education.map((edu, i) => (
        <View key={i} style={styles.itemGroup} wrap={false}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{edu.school}</Text>
            <Text style={styles.itemDate}>{formatDateRange(edu.startDate, edu.endDate, edu.current, false)}</Text>
          </View>
          <Text style={styles.itemSubtitle}>{[edu.degree, edu.field].filter(Boolean).join(" • ")}</Text>
          {edu.location ? <Text style={styles.itemLocation}>{edu.location}</Text> : null}
          {edu.gpa ? <Text style={styles.itemLocation}>Not Ortalaması: {edu.gpa}</Text> : null}
          {edu.description ? <Text style={styles.itemDescription}>{edu.description}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function renderSkills(skills: string[]) {
  if (!skills || skills.length === 0) return null;
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Yetenekler</Text>
      <View style={styles.skillsContainer}>
        {skills.map((skill, i) => (
          <Text key={i} style={styles.skillBadge}>{skill}</Text>
        ))}
      </View>
    </View>
  );
}

function renderLanguages(languages: CvLanguage[]) {
  if (!languages || languages.length === 0) return null;
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Yabancı Diller</Text>
      {languages.map((lang, i) => (
        <View key={i} style={styles.simpleItem}>
          <Text style={styles.simpleItemLeft}>{lang.language}</Text>
          <Text style={styles.simpleItemRight}>{getLanguageLevelLabel(lang.level)}</Text>
        </View>
      ))}
    </View>
  );
}

function renderCertifications(certifications: CvCertification[]) {
  if (!certifications || certifications.length === 0) return null;
  return (
    <View wrap={true}>
      <Text style={styles.sectionTitle}>Sertifikalar</Text>
      {certifications.map((cert, i) => (
        <View key={i} style={styles.itemGroup} wrap={false}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{cert.name}</Text>
            <Text style={styles.itemDate}>{cert.date}</Text>
          </View>
          <Text style={styles.itemSubtitle}>{cert.issuer}</Text>
          {cert.url ? <Link src={cert.url} style={[styles.itemLocation, styles.linkHighlight]}>Doğrula</Link> : null}
        </View>
      ))}
    </View>
  );
}

function renderProjects(projects: CvProject[]) {
  if (!projects || projects.length === 0) return null;
  return (
    <View wrap={true}>
      <Text style={styles.sectionTitle}>Projeler</Text>
      {projects.map((proj, i) => (
        <View key={i} style={styles.itemGroup} wrap={false}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{proj.title}</Text>
            <Text style={styles.itemDate}>{proj.date}</Text>
          </View>
          {proj.description ? <Text style={styles.itemDescription}>{proj.description}</Text> : null}
          {proj.technologies && proj.technologies.length > 0 && (
            <View style={[styles.skillsContainer, { marginTop: 4 }]}>
              {proj.technologies.map((tech, ti) => (
                <Text key={ti} style={styles.skillBadge}>{tech}</Text>
              ))}
            </View>
          )}
          {proj.url ? <Link src={proj.url} style={[styles.itemLocation, styles.linkHighlight, { marginTop: 4 }]}>{proj.url}</Link> : null}
        </View>
      ))}
    </View>
  );
}

function renderReferences(references: CvReference[]) {
  if (!references || references.length === 0) return null;
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Referanslar</Text>
      {references.map((ref, i) => (
        <View key={i} style={styles.referenceBlock}>
          <Text style={styles.referenceName}>{ref.name}</Text>
          {(ref.position || ref.company) && (
            <Text style={styles.referenceMeta}>{[ref.position, ref.company].filter(Boolean).join(" • ")}</Text>
          )}
          {(ref.email || ref.phone) && (
            <Text style={styles.referenceMeta}>{[ref.email, ref.phone].filter(Boolean).join(" • ")}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function renderCustomSections(customSections: CvCustomSection[]) {
  if (!customSections || customSections.length === 0) return null;
  return (
    <>
      {customSections.map((section, i) => (
        section.title && section.items && section.items.length > 0 ? (
          <View key={i} wrap={true}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, ii) => (
              <Text key={ii} style={styles.customSectionItem} wrap={false}>• {item}</Text>
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
  // Eski proplar API'den gelebilir ama artık kullanılmıyor.
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
        
        {/* Her sayfanın üstüne (1. sayfa hariç) küçük isim yazdırma */}
        <Text style={styles.pageHeader} render={({ pageNumber }) => (
          pageNumber > 1 ? `${profile.first_name} ${profile.last_name}` : ''
        )} fixed />

        {renderHeader(profile)}
        {renderBio(profile.bio)}
        {renderExperience(experience)}
        {renderEducation(education)}
        {renderProjects(projects)}
        {renderSkills(skills)}
        {renderLanguages(languages)}
        {renderCertifications(certifications)}
        {renderReferences(references)}
        {renderCustomSections(customSections)}

        {/* Sayfa numaraları: 1 / 2 formatında */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
}
