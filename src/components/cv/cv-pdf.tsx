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

type CvStyles = ReturnType<typeof getStyles>;

// Dinamik stilleri şablon ve tema rengine göre oluşturan fonksiyon
function getStyles(templateName: string = 'modern', primaryColor: string = '#3B82F6') {
  const isBrutalist = templateName === 'brutalist';

  return StyleSheet.create({
    page: {
      padding: isBrutalist ? 30 : 40,
      fontFamily: 'Roboto',
      fontSize: 10,
      lineHeight: 1.4,
      color: isBrutalist ? '#000000' : '#333333',
      backgroundColor: '#ffffff',
    },
    // Üst Bilgi (Header)
    header: {
      marginBottom: isBrutalist ? 20 : 25,
      borderBottomWidth: isBrutalist ? 3 : 1,
      borderBottomColor: isBrutalist ? '#000000' : '#eeeeee',
      paddingBottom: 15,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerText: {
      flex: 1,
      marginRight: 15,
    },
    avatar: {
      width: 65,
      height: 65,
      borderRadius: isBrutalist ? 0 : 32.5,
      borderWidth: isBrutalist ? 2 : 0,
      borderColor: '#000000',
    },
    name: {
      fontSize: isBrutalist ? 28 : 22,
      fontWeight: 'bold',
      color: isBrutalist ? '#000000' : '#111111',
      marginBottom: 6,
      lineHeight: 1.1,
      textTransform: isBrutalist ? 'uppercase' : 'none',
    },
    title: {
      fontSize: 12,
      color: primaryColor,
      fontWeight: 'bold',
      marginTop: 4,
      marginBottom: 8,
      lineHeight: 1.2,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      fontSize: 9,
      color: '#555555',
    },
    contactItem: {
      marginRight: 10,
    },
    link: {
      color: '#555555',
      textDecoration: 'none',
    },

    // Düzen Yapısı (Layout)
    mainContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    // Modern Çift Sütunlu Stiller
    leftColumn: {
      width: '32%',
      flexDirection: 'column',
    },
    rightColumn: {
      width: '64%',
      flexDirection: 'column',
    },
    // Tek Sütunlu Stiller (Classic & Brutalist)
    fullWidthColumn: {
      width: '100%',
    },

    // Bölüm Başlıkları
    sectionTitle: {
      fontSize: isBrutalist ? 13 : 12,
      fontWeight: 'bold',
      color: isBrutalist ? '#000000' : primaryColor,
      textTransform: 'uppercase',
      borderBottomWidth: isBrutalist ? 2 : 0,
      borderBottomColor: '#000000',
      marginBottom: 10,
      marginTop: 15,
      paddingBottom: isBrutalist ? 3 : 0,
    },

    // Hakkımda (Bio)
    bioText: {
      fontSize: 10,
      lineHeight: 1.4,
      marginBottom: 15,
      color: '#444444',
    },

    // İş & Eğitim Grupları
    itemGroup: {
      marginBottom: 12,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    itemTitle: {
      fontWeight: 'bold',
      fontSize: 10.5,
      color: '#111111',
    },
    itemDate: {
      fontSize: 9,
      color: '#666666',
    },
    itemSubtitle: {
      fontSize: 9.5,
      color: '#555555',
      marginBottom: 4,
      fontWeight: 'bold',
    },
    itemLocation: {
      fontSize: 8.5,
      color: '#888888',
      marginBottom: 3,
    },
    itemDescription: {
      fontSize: 9,
      color: '#555555',
      lineHeight: 1.3,
    },
    itemDescriptionLine: {
      fontSize: 9,
      color: '#555555',
      lineHeight: 1.3,
      marginBottom: 1,
    },

    // Yetenek Rozetleri
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: 5,
    },
    skillBadge: {
      backgroundColor: isBrutalist ? '#ffffff' : '#f3f4f6',
      borderWidth: isBrutalist ? 1 : 0,
      borderColor: '#000000',
      paddingVertical: 3,
      paddingHorizontal: 6,
      borderRadius: isBrutalist ? 0 : 4,
      fontSize: 8.5,
      marginRight: 4,
      marginBottom: 4,
      color: '#333333',
    },

    // Diller & Sertifikalar & Referanslar
    simpleItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
      fontSize: 9.5,
    },
    simpleItemLeft: {
      fontWeight: 'bold',
    },
    simpleItemRight: {
      color: '#666666',
    },
    referenceBlock: {
      marginBottom: 8,
    },
    referenceName: {
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#111111',
    },
    referenceMeta: {
      fontSize: 8.5,
      color: '#666666',
    },
    customSectionItem: {
      fontSize: 9,
      color: '#444444',
      marginBottom: 3,
    },
  });
}

// Dil seviyelerini Türkçeleştir
function getLanguageLevelLabel(level: string) {
  switch (level) {
    case "beginner": return "Başlangıç";
    case "intermediate": return "Orta";
    case "advanced": return "İleri";
    case "native": return "Anadil";
    default: return level;
  }
}

// Aşağıdaki render* fonksiyonları, @react-pdf/renderer belgesi içinde tekrar
// kullanılan bölümleri üretir. Bilinçli olarak birer React bileşeni (büyük harfle
// başlayan fonksiyon component'i) OLARAK KULLANILMAZLAR; render sırasında yeni
// bileşen tanımlanmasını (ve buna bağlı lint uyarılarını / olası state kaybını)
// önlemek için düz fonksiyon çağrısı olarak (örn. {renderBio(...)}) kullanılırlar.

function renderHeader(styles: CvStyles, profile: Profile) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
          <Text style={styles.title}>{profile.headline || profile.department || "Yönetim Bilişim Sistemleri Öğrencisi"}</Text>
          <View style={styles.contactRow}>
            {profile.location && <Text style={styles.contactItem}>{profile.location}</Text>}
            {profile.edu_email && <Text style={styles.contactItem}>{profile.edu_email}</Text>}
            {profile.phone && <Text style={styles.contactItem}>{profile.phone}</Text>}
            {profile.personal_email && profile.personal_email !== profile.edu_email && (
              <Text style={styles.contactItem}>{profile.personal_email}</Text>
            )}
            {profile.linkedin_url && <Link src={profile.linkedin_url} style={[styles.contactItem, styles.link]}>LinkedIn</Link>}
            {profile.github_url && <Link src={profile.github_url} style={[styles.contactItem, styles.link]}>GitHub</Link>}
            {profile.website_url && <Link src={profile.website_url} style={[styles.contactItem, styles.link]}>Web Sitesi</Link>}
          </View>
        </View>
        {profile.avatar_url && (
          <Image src={profile.avatar_url} style={styles.avatar} />
        )}
      </View>
    </View>
  );
}

function renderBio(styles: CvStyles, bio: string | null) {
  if (!bio) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Hakkımda</Text>
      <Text style={styles.bioText}>{bio}</Text>
    </View>
  );
}

function renderExperience(styles: CvStyles, experience: CvExperience[]) {
  if (!experience || experience.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Deneyim</Text>
      {experience.map((exp, i) => (
        <View key={i} style={styles.itemGroup}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{exp.title}</Text>
            <Text style={styles.itemDate}>{formatDateRange(exp.startDate, exp.endDate, exp.current)}</Text>
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

function renderEducation(styles: CvStyles, education: CvEducation[]) {
  if (!education || education.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Eğitim</Text>
      {education.map((edu, i) => (
        <View key={i} style={styles.itemGroup}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{edu.school}</Text>
            <Text style={styles.itemDate}>{formatDateRange(edu.startDate, edu.endDate, edu.current)}</Text>
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

function renderSkills(styles: CvStyles, skills: string[]) {
  if (!skills || skills.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Yetenekler</Text>
      <View style={styles.skillsContainer}>
        {skills.map((skill, i) => (
          <Text key={i} style={styles.skillBadge}>{skill}</Text>
        ))}
      </View>
    </View>
  );
}

function renderLanguages(styles: CvStyles, languages: CvLanguage[]) {
  if (!languages || languages.length === 0) return null;
  return (
    <View>
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

function renderCertifications(styles: CvStyles, certifications: CvCertification[]) {
  if (!certifications || certifications.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Sertifikalar</Text>
      {certifications.map((cert, i) => (
        <View key={i} style={styles.itemGroup}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{cert.name}</Text>
            <Text style={styles.itemDate}>{cert.date}</Text>
          </View>
          <Text style={styles.itemSubtitle}>{cert.issuer}</Text>
        </View>
      ))}
    </View>
  );
}

function renderProjects(styles: CvStyles, projects: CvProject[]) {
  if (!projects || projects.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Projeler</Text>
      {projects.map((proj, i) => (
        <View key={i} style={styles.itemGroup}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{proj.title}</Text>
            <Text style={styles.itemDate}>{proj.date}</Text>
          </View>
          {proj.description ? <Text style={styles.itemDescription}>{proj.description}</Text> : null}
          {proj.technologies && proj.technologies.length > 0 && (
            <View style={styles.skillsContainer}>
              {proj.technologies.map((tech, ti) => (
                <Text key={ti} style={styles.skillBadge}>{tech}</Text>
              ))}
            </View>
          )}
          {proj.url ? <Link src={proj.url} style={[styles.itemLocation, styles.link]}>{proj.url}</Link> : null}
        </View>
      ))}
    </View>
  );
}

function renderReferences(styles: CvStyles, references: CvReference[]) {
  if (!references || references.length === 0) return null;
  return (
    <View>
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

function renderCustomSections(styles: CvStyles, customSections: CvCustomSection[]) {
  if (!customSections || customSections.length === 0) return null;
  return (
    <>
      {customSections.map((section, i) => (
        section.title && section.items && section.items.length > 0 ? (
          <View key={i}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, ii) => (
              <Text key={ii} style={styles.customSectionItem}>• {item}</Text>
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
  customSections = [],
  templateName = 'modern',
  primaryColor = '#3B82F6'
}: CvPdfProps) {
  const styles = getStyles(templateName, primaryColor);
  const isModern = templateName === 'modern';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader(styles, profile)}

        {isModern ? (
          // MODERN ÇİFT SÜTUN DÜZENİ
          <View style={styles.mainContainer}>
            {/* Sol Sütun */}
            <View style={styles.leftColumn}>
              {renderSkills(styles, skills)}
              {renderLanguages(styles, languages)}
              {renderReferences(styles, references)}
            </View>

            {/* Sağ Sütun */}
            <View style={styles.rightColumn}>
              {renderBio(styles, profile.bio)}
              {renderExperience(styles, experience)}
              {renderEducation(styles, education)}
              {renderProjects(styles, projects)}
              {renderCertifications(styles, certifications)}
              {renderCustomSections(styles, customSections)}
            </View>
          </View>
        ) : (
          // TEK SÜTUN DÜZENİ (Classic veya Brutalist)
          <View style={styles.mainContainer}>
            <View style={styles.fullWidthColumn}>
              {renderBio(styles, profile.bio)}
              {renderExperience(styles, experience)}
              {renderEducation(styles, education)}
              {renderProjects(styles, projects)}
              {renderSkills(styles, skills)}
              {renderLanguages(styles, languages)}
              {renderCertifications(styles, certifications)}
              {renderReferences(styles, references)}
              {renderCustomSections(styles, customSections)}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
