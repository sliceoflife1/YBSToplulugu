"use client";

import { useState, useEffect } from "react";
import { Download, FileText } from "lucide-react";
import type { Profile, CvData } from "@/types/database";

import { CvPdf } from "@/components/cv/cv-pdf";
import dynamic from 'next/dynamic';
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);

interface Props {
  profile: Profile;
  cvData: CvData | null;
}

export default function CvDownloadButton({ profile, cvData }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    if (cvData) {
      try {
        const edu = typeof cvData.education === 'string' ? JSON.parse(cvData.education) : cvData.education;
        setEducation(Array.isArray(edu) ? edu : []);
      } catch { setEducation([]); }

      try {
        const exp = typeof cvData.experience === 'string' ? JSON.parse(cvData.experience) : cvData.experience;
        setExperience(Array.isArray(exp) ? exp : []);
      } catch { setExperience([]); }
    }
  }, [cvData]);

  if (!isMounted) {
    return (
      <button disabled className="w-full rounded-lg bg-[var(--color-muted)] px-4 py-2 text-sm font-medium opacity-50 flex justify-center items-center gap-2">
        <FileText className="h-4 w-4" /> Yükleniyor...
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <CvPdf 
          profile={profile} 
          cvData={cvData as any} 
          skills={cvData?.skills || []} 
          education={education} 
          experience={experience} 
        />
      }
      fileName={`CV_${profile.first_name}_${profile.last_name}.pdf`}
      className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
    >
      {({ loading }) => (
        <>
          <Download className="h-4 w-4" />
          {loading ? "PDF Hazırlanıyor..." : "CV'yi İndir (PDF)"}
        </>
      )}
    </PDFDownloadLink>
  );
}
