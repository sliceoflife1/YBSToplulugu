"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, Download, Eye, Save, GraduationCap, Briefcase, Award, Languages, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import type { Profile, CvData } from "@/types/database";

// PDF component
import { CvPdf } from "@/components/cv/cv-pdf";
// dynamic import for PDFDownloadLink to prevent SSR hydration errors
import dynamic from 'next/dynamic';
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);

export default function CvBuilderPage() {
  const t = useTranslations("cv");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvData, setCvData] = useState<CvData | null>(null);
  
  // States for dynamic arrays
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);

  // Is Mounted check for PDF
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [profileRes, cvRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
        supabase.from("cv_data").select("*").eq("user_id", user.id).single<CvData>(),
      ]);

      setProfile(profileRes.data);
      if (cvRes.data) {
        setCvData(cvRes.data);
        setSkills(cvRes.data.skills || []);
        
        // Parse JSONB arrays safely
        try {
          const edu = typeof cvRes.data.education === 'string' ? JSON.parse(cvRes.data.education) : cvRes.data.education;
          setEducation(Array.isArray(edu) ? edu : []);
        } catch { setEducation([]); }

        try {
          const exp = typeof cvRes.data.experience === 'string' ? JSON.parse(cvRes.data.experience) : cvRes.data.experience;
          setExperience(Array.isArray(exp) ? exp : []);
        } catch { setExperience([]); }
      }
      setLoading(false);
    }
    load();
  }, [router]);

  // Skill Handlers
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };
  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  // Education Handlers
  const addEducation = () => {
    setEducation([...education, { school: "", department: "", startYear: "", endYear: "" }]);
  };
  const updateEducation = (index: number, field: string, value: string) => {
    const newEdu = [...education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setEducation(newEdu);
  };
  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Experience Handlers
  const addExperience = () => {
    setExperience([...experience, { company: "", position: "", duration: "", description: "" }]);
  };
  const updateExperience = (index: number, field: string, value: string) => {
    const newExp = [...experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setExperience(newExp);
  };
  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();

    const payload = {
      user_id: profile.id,
      skills,
      education,
      experience,
      certifications: cvData?.certifications || [],
      languages: cvData?.languages || [],
      updated_at: new Date().toISOString(),
    };

    if (cvData) {
      await supabase.from("cv_data").update(payload).eq("id", cvData.id);
    } else {
      const { data } = await supabase.from("cv_data").insert(payload).select().single();
      if (data) setCvData(data);
    }

    toast.success("CV başarıyla kaydedildi!");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-sm text-[var(--color-muted-foreground)]">Özgeçmişinizi oluşturun ve PDF olarak indirin.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              
              {isMounted && profile && (
                <PDFDownloadLink
                  document={
                    <CvPdf 
                      profile={profile} 
                      cvData={cvData as any} 
                      skills={skills} 
                      education={education} 
                      experience={experience} 
                    />
                  }
                  fileName={`CV_${profile.first_name}_${profile.last_name}.pdf`}
                  className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  {({ loading: pdfLoading }) => (
                    <>
                      <Download className="h-4 w-4" />
                      {pdfLoading ? "PDF Hazırlanıyor..." : "PDF İndir"}
                    </>
                  )}
                </PDFDownloadLink>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Editor */}
            <div className="space-y-6">
              
              {/* Education */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <GraduationCap className="h-5 w-5 text-emerald-500" />
                    {t("education")}
                  </h2>
                  <button onClick={addEducation} className="text-xs flex items-center gap-1 text-[var(--color-primary)] hover:underline">
                    <Plus className="h-3 w-3" /> Ekle
                  </button>
                </div>
                
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={index} className="relative rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-background)]">
                      <button onClick={() => removeEducation(index)} className="absolute top-2 right-2 text-[var(--color-muted-foreground)] hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-[var(--color-foreground)]">Okul / Üniversite</label>
                          <input value={edu.school} onChange={e => updateEducation(index, 'school', e.target.value)} className="w-full rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: Dokuz Eylül Üniversitesi" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-[var(--color-foreground)]">Bölüm</label>
                          <input value={edu.department} onChange={e => updateEducation(index, 'department', e.target.value)} className="w-full rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: Yönetim Bilişim Sistemleri" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--color-foreground)]">Başlangıç Yılı</label>
                          <input value={edu.startYear} onChange={e => updateEducation(index, 'startYear', e.target.value)} className="w-full rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="2020" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--color-foreground)]">Bitiş Yılı</label>
                          <input value={edu.endYear} onChange={e => updateEducation(index, 'endYear', e.target.value)} className="w-full rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="2024 veya Devam Ediyor" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {education.length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4 border border-dashed rounded-lg">Henüz eğitim bilgisi eklenmedi.</p>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <Briefcase className="h-5 w-5 text-orange-500" />
                    {t("experience")}
                  </h2>
                  <button onClick={addExperience} className="text-xs flex items-center gap-1 text-[var(--color-primary)] hover:underline">
                    <Plus className="h-3 w-3" /> Ekle
                  </button>
                </div>
                
                <div className="space-y-4">
                  {experience.map((exp, index) => (
                    <div key={index} className="relative rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-background)]">
                      <button onClick={() => removeExperience(index)} className="absolute top-2 right-2 text-[var(--color-muted-foreground)] hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-[var(--color-foreground)]">Şirket / Kurum</label>
                          <input value={exp.company} onChange={e => updateExperience(index, 'company', e.target.value)} className="w-full rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: Google Türkiye" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-[var(--color-foreground)]">Pozisyon</label>
                          <input value={exp.position} onChange={e => updateExperience(index, 'position', e.target.value)} className="w-full rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: Frontend Developer" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-[var(--color-foreground)]">Süre</label>
                          <input value={exp.duration} onChange={e => updateExperience(index, 'duration', e.target.value)} className="w-full rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: Haz 2023 - Devam Ediyor" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-[var(--color-foreground)]">Açıklama</label>
                          <textarea rows={2} value={exp.description} onChange={e => updateExperience(index, 'description', e.target.value)} className="w-full rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none resize-none" placeholder="Görevleriniz ve başarılarınız..." />
                        </div>
                      </div>
                    </div>
                  ))}
                  {experience.length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4 border border-dashed rounded-lg">Henüz deneyim bilgisi eklenmedi.</p>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                  <Award className="h-5 w-5 text-[var(--color-primary)]" />
                  {t("skills")}
                </h2>
                <div className="flex gap-2">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    className="flex-1 rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2 text-sm focus:border-[var(--color-ring)] focus:outline-none"
                    placeholder="Yetenek ekle..."
                  />
                  <button onClick={addSkill} className="rounded-lg bg-[var(--color-primary)] px-3 text-white hover:opacity-90">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <span key={skill} className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]">
                        {skill}
                        <button onClick={() => removeSkill(skill)}><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right: Preview (Web version) */}
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-sm dark:bg-[var(--color-card)] lg:sticky top-6 h-fit">
              <h2 className="mb-6 flex items-center gap-2 font-semibold text-[var(--color-muted-foreground)]">
                <Eye className="h-4 w-4" /> {t("preview")}
              </h2>

              <div className="space-y-6">
                <div className="border-b border-[var(--color-border)] pb-4">
                  <h3 className="text-xl font-bold text-[var(--color-foreground)]">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{profile?.department}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--color-muted-foreground)]">
                    {profile?.edu_email && <span>{profile.edu_email}</span>}
                    {profile?.phone && <span>• {profile.phone}</span>}
                  </div>
                </div>

                {profile?.bio && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">Hakkımda</h4>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{profile.bio}</p>
                  </div>
                )}

                {experience.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-3">Deneyim</h4>
                    <div className="space-y-4">
                      {experience.map((exp, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-sm">{exp.position || "Pozisyon Belirtilmedi"}</span>
                            <span className="text-xs text-[var(--color-muted-foreground)]">{exp.duration}</span>
                          </div>
                          <div className="text-xs italic text-[var(--color-muted-foreground)] mb-1">{exp.company}</div>
                          {exp.description && <p className="text-xs text-[var(--color-foreground)]">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {education.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-3">Eğitim</h4>
                    <div className="space-y-3">
                      {education.map((edu, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-sm">{edu.school || "Okul Belirtilmedi"}</span>
                            <span className="text-xs text-[var(--color-muted-foreground)]">{edu.startYear} - {edu.endYear}</span>
                          </div>
                          <div className="text-xs text-[var(--color-muted-foreground)]">{edu.department}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {skills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">Yetenekler</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <span key={skill} className="rounded bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-foreground)] border border-[var(--color-border)]">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
