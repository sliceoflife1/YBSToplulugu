import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { Profile, CvData } from "@/types/database";

// Register a font that supports Turkish characters to avoid square boxes
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#333333',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 4,
  },
  contact: {
    fontSize: 10,
    color: '#666666',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb', // primary color
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 20,
  },
  bio: {
    marginBottom: 20,
  },
  itemGroup: {
    marginBottom: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  itemDate: {
    fontSize: 10,
    color: '#666666',
  },
  itemSubtitle: {
    fontStyle: 'italic',
    color: '#555555',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 10,
  },
  skillsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  skillBadge: {
    backgroundColor: '#f3f4f6',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 10,
    marginRight: 5,
    marginBottom: 5,
  }
});

interface CvPdfProps {
  profile: Profile;
  cvData: CvData;
  skills: string[];
  education: any[];
  experience: any[];
}

export function CvPdf({ profile, cvData, skills, education, experience }: CvPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.header}>
          <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
          <View style={styles.contact}>
            {profile.department && <Text>{profile.department}</Text>}
            {profile.edu_email && <Text>{profile.edu_email}</Text>}
            {profile.phone && <Text>{profile.phone}</Text>}
            {profile.linkedin_url && <Text>LinkedIn</Text>}
            {profile.github_url && <Text>GitHub</Text>}
          </View>
        </View>

        {profile.bio && (
          <View style={styles.bio}>
            <Text style={styles.sectionTitle}>Hakkımda</Text>
            <Text>{profile.bio}</Text>
          </View>
        )}

        {experience && experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Deneyim</Text>
            {experience.map((exp: any, i: number) => (
              <View key={i} style={styles.itemGroup}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{exp.position}</Text>
                  <Text style={styles.itemDate}>{exp.duration}</Text>
                </View>
                <Text style={styles.itemSubtitle}>{exp.company}</Text>
                {exp.description && <Text style={styles.itemDescription}>{exp.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {education && education.length > 0 && (
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
        )}

        {skills && skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Yetenekler</Text>
            <View style={styles.skillsGroup}>
              {skills.map((skill: string, i: number) => (
                <Text key={i} style={styles.skillBadge}>{skill}</Text>
              ))}
            </View>
          </View>
        )}

      </Page>
    </Document>
  );
}
