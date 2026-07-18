import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { Profile, CvData } from "@/types/database";

// Türkçe karakter desteği için Roboto yazı tipini kaydet
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }
  ]
});

// Dinamik stilleri şablon ve tema rengine göre oluşturan fonksiyon
const getStyles = (templateName: string = 'modern', primaryColor: string = '#3B82F6') => {
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
    name: {
      fontSize: isBrutalist ? 28 : 22,
      fontWeight: 'bold',
      color: isBrutalist ? '#000000' : '#111111',
      marginBottom: 5,
      textTransform: isBrutalist ? 'uppercase' : 'none',
    },
    title: {
      fontSize: 12,
      color: primaryColor,
      fontWeight: 'bold',
      marginBottom: 8,
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
    itemDescription: {
      fontSize: 9,
      color: '#555555',
      lineHeight: 1.3,
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
      padding: '3 6',
      borderRadius: isBrutalist ? 0 : 4,
      fontSize: 8.5,
      marginRight: 4,
      marginBottom: 4,
      color: '#333333',
    },

    // Diller & Sertifikalar
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
    }
  });
};

interface CvPdfProps {
  profile: Profile;
  cvData: CvData | null;
  skills: string[];
  education: any[];
  experience: any[];
  certifications?: any[];
  languages?: any[];
  templateName?: string;
  primaryColor?: string;
}

export function CvPdf({ 
  profile, 
  cvData, 
  skills, 
  education, 
  experience, 
  certifications = [], 
  languages = [],
  templateName = 'modern', 
  primaryColor = '#3B82F6' 
}: CvPdfProps) {
  const styles = getStyles(templateName, primaryColor);
  const isModern = templateName === 'modern';

  // Dil seviyelerini Türkçeleştir
  const getLanguageLevelLabel = (level: string) => {
    switch (level) {
      case "beginner": return "Başlangıç";
      case "intermediate": return "Orta";
      case "advanced": return "İleri";
      case "native": return "Anadil";
      default: return level;
    }
  };

  // Header Bölümü
  const HeaderView = () => (
    <View style={styles.header}>
      <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
      <Text style={styles.title}>{profile.department || "Yönetim Bilişim Sistemleri Öğrencisi"}</Text>
      <View style={styles.contactRow}>
        {profile.edu_email && <Text style={styles.contactItem}>📧 {profile.edu_email}</Text>}
        {profile.phone && <Text style={styles.contactItem}>📞 {profile.phone}</Text>}
        {profile.personal_email && profile.personal_email !== profile.edu_email && (
          <Text style={styles.contactItem}>✉️ {profile.personal_email}</Text>
        )}
        {profile.linkedin_url && <Text style={styles.contactItem}>🔗 LinkedIn</Text>}
        {profile.github_url && <Text style={styles.contactItem}>💻 GitHub</Text>}
      </View>
    </View>
  );

  // Hakkımda Bölümü
  const BioView = () => profile.bio ? (
    <View>
      <Text style={styles.sectionTitle}>Hakkımda</Text>
      <Text style={styles.bioText}>{profile.bio}</Text>
    </View>
  ) : null;

  // Deneyim Bölümü
  const ExperienceView = () => experience && experience.length > 0 ? (
    <View>
      <Text style={styles.sectionTitle}>Deneyim</Text>
      {experience.map((exp: any, i: number) => (
        <View key={i} style={styles.itemGroup}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{exp.position}</Text>
            <Text style={styles.itemDate}>{exp.duration}</Text>
          </View>
          <Text style={styles.itemSubtitle}>{exp.company}</Text>
          {exp.description ? <Text style={styles.itemDescription}>{exp.description}</Text> : null}
        </View>
      ))}
    </View>
  ) : null;

  // Eğitim Bölümü
  const EducationView = () => education && education.length > 0 ? (
    <View>
      <Text style={styles.sectionTitle}>Eğitim</Text>
      {education.map((edu: any, i: number) => (
        <View key={i} style={styles.itemGroup}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{edu.school}</Text>
            <Text style={styles.itemDate}>{edu.startYear} - {edu.endYear}</Text>
          </View>
          <Text style={styles.itemSubtitle}>{edu.department}</Text>
        </View>
      ))}
    </View>
  ) : null;

  // Yetenekler Bölümü
  const SkillsView = () => skills && skills.length > 0 ? (
    <View>
      <Text style={styles.sectionTitle}>Yetenekler</Text>
      <View style={styles.skillsContainer}>
        {skills.map((skill: string, i: number) => (
          <Text key={i} style={styles.skillBadge}>{skill}</Text>
        ))}
      </View>
    </View>
  ) : null;

  // Diller Bölümü
  const LanguagesView = () => languages && languages.length > 0 ? (
    <View>
      <Text style={styles.sectionTitle}>Yabancı Diller</Text>
      {languages.map((lang: any, i: number) => (
        <View key={i} style={styles.simpleItem}>
          <Text style={styles.simpleItemLeft}>{lang.language}</Text>
          <Text style={styles.simpleItemRight}>{getLanguageLevelLabel(lang.level)}</Text>
        </View>
      ))}
    </View>
  ) : null;

  // Sertifikalar Bölümü
  const CertificationsView = () => certifications && certifications.length > 0 ? (
    <View>
      <Text style={styles.sectionTitle}>Sertifikalar</Text>
      {certifications.map((cert: any, i: number) => (
        <View key={i} style={styles.itemGroup}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{cert.name}</Text>
            <Text style={styles.itemDate}>{cert.date}</Text>
          </View>
          <Text style={styles.itemSubtitle}>{cert.issuer}</Text>
        </View>
      ))}
    </View>
  ) : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <HeaderView />

        {isModern ? (
          // MODERN ÇİFT SÜTUN DÜZENİ
          <View style={styles.mainContainer}>
            {/* Sol Sütun */}
            <View style={styles.leftColumn}>
              <SkillsView />
              <LanguagesView />
            </View>

            {/* Sağ Sütun */}
            <View style={styles.rightColumn}>
              <BioView />
              <ExperienceView />
              <EducationView />
              <CertificationsView />
            </View>
          </View>
        ) : (
          // TEK SÜTUN DÜZENİ (Classic veya Brutalist)
          <View style={styles.mainContainer}>
            <View style={styles.fullWidthColumn}>
              <BioView />
              <ExperienceView />
              <EducationView />
              <SkillsView />
              <LanguagesView />
              <CertificationsView />
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
