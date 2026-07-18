"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  Plus, X, Download, Eye, Save, GraduationCap, Briefcase, Award, Languages, 
  Trash2, Award as CertificateIcon, Palette, Layout, Settings, Mail, Phone, Link2, Globe
} from "lucide-react";
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
  const locale = useLocale();
  const isEn = locale === "en";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvData, setCvData] = useState<CvData | null>(null);
  
  // Şablon ve Tema Renk Durumları
  const [templateName, setTemplateName] = useState<string>("modern");
  const [primaryColor, setPrimaryColor] = useState<string>("#3B82F6");

  // Dinamik Diziler
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [bio, setBio] = useState<string>("");

  // Editör Sekme Yönetimi
  const [editorTab, setEditorTab] = useState<"design" | "content">("design");

  // Is Mounted check for PDF
  const [isMounted, setIsMounted] = useState(false);

  // Premium Renk Paletleri
  const colorPalettes = [
    { value: "#3B82F6", label: isEn ? "Classic Blue" : "Klasik Mavi" },
    { value: "#10B981", label: isEn ? "Emerald Green" : "Zümrüt Yeşili" },
    { value: "#F59E0B", label: isEn ? "Sun Orange" : "Güneş Turuncusu" },
    { value: "#8B5CF6", label: isEn ? "Royal Purple" : "Kraliyet Moru" },
    { value: "#EF4444", label: isEn ? "Vibrant Red" : "Canlı Kırmızı" },
    { value: "#1F2937", label: isEn ? "Charcoal Black" : "Kömür Siyahı" },
  ];

  // Dil seviyesi etiketleri
  const getLanguageLevelLabel = (level: string) => {
    switch (level) {
      case "beginner": return isEn ? "Beginner" : "Başlangıç";
      case "intermediate": return isEn ? "Intermediate" : "Orta";
      case "advanced": return isEn ? "Advanced" : "İleri";
      case "native": return isEn ? "Native" : "Anadil";
      default: return level;
    }
  };

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

      if (profileRes.data) {
        setProfile(profileRes.data);
        setBio(profileRes.data.bio || "");
      }

      if (cvRes.data) {
        setCvData(cvRes.data);
        setSkills(cvRes.data.skills || []);
        
        // Veritabanından gelen şablon tercihlerini ata (varsayılan: modern, #3B82F6)
        setTemplateName((cvRes.data as any).template_name || "modern");
        setPrimaryColor((cvRes.data as any).primary_color || "#3B82F6");
        
        try {
          const edu = typeof cvRes.data.education === 'string' ? JSON.parse(cvRes.data.education) : cvRes.data.education;
          setEducation(Array.isArray(edu) ? edu : []);
        } catch { setEducation([]); }

        try {
          const exp = typeof cvRes.data.experience === 'string' ? JSON.parse(cvRes.data.experience) : cvRes.data.experience;
          setExperience(Array.isArray(exp) ? exp : []);
        } catch { setExperience([]); }

        try {
          const certs = typeof cvRes.data.certifications === 'string' ? JSON.parse(cvRes.data.certifications) : cvRes.data.certifications;
          setCertifications(Array.isArray(certs) ? certs : []);
        } catch { setCertifications([]); }

        try {
          const langs = typeof cvRes.data.languages === 'string' ? JSON.parse(cvRes.data.languages) : cvRes.data.languages;
          setLanguages(Array.isArray(langs) ? langs : []);
        } catch { setLanguages([]); }
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

  // Language Handlers
  const addLanguage = () => {
    setLanguages([...languages, { language: "", level: "intermediate" }]);
  };
  const updateLanguage = (index: number, field: string, value: string) => {
    const newLangs = [...languages];
    newLangs[index] = { ...newLangs[index], [field]: value };
    setLanguages(newLangs);
  };
  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  // Certification Handlers
  const addCertification = () => {
    setCertifications([...certifications, { name: "", issuer: "", date: "" }]);
  };
  const updateCertification = (index: number, field: string, value: string) => {
    const newCerts = [...certifications];
    newCerts[index] = { ...newCerts[index], [field]: value };
    setCertifications(newCerts);
  };
  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
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
      certifications,
      languages,
      template_name: templateName,
      primary_color: primaryColor,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (cvData) {
      const { error: updateError } = await supabase.from("cv_data").update(payload).eq("id", cvData.id);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase.from("cv_data").insert(payload).select().single();
      error = insertError;
      if (data) setCvData(data);
    }

    // Ayrıca hakkımda (bio) alanını profile tablosuna kaydet
    if (bio !== profile.bio) {
      await supabase.from("profiles").update({ bio }).eq("id", profile.id);
    }

    if (error) {
      toast.error("Kaydetme sırasında bir hata oluştu");
    } else {
      toast.success("CV ve şablon tercihleriniz başarıyla kaydedildi!");
    }
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
            <div>
              <h1 className="text-2xl font-bold">Özgeçmiş Tasarım Paneli & Editör</h1>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Şablon ve renk tercihlerinizi belirleyin, CV verilerinizi anında güncelleyin.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-5 py-2.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-50 transition-all shadow-sm"
              >
                <Save className="h-4 w-4" />
                {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
              </button>
              
              {isMounted && profile && (
                <PDFDownloadLink
                  document={
                    <CvPdf 
                      profile={{ ...profile, bio }} 
                      cvData={cvData as any} 
                      skills={skills} 
                      education={education} 
                      experience={experience} 
                      certifications={certifications}
                      languages={languages}
                      templateName={templateName}
                      primaryColor={primaryColor}
                    />
                  }
                  fileName={`CV_${profile.first_name}_${profile.last_name}.pdf`}
                  className="flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 shadow-md transition-all"
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

          <div className="grid gap-6 lg:grid-cols-12 items-start">
            
            {/* SOL KOLON: Düzenleyici ve Tasarım Ayarları (5 Column) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Sekme Seçici */}
              <div className="flex border-b border-[var(--color-border)] pb-px gap-1">
                <button 
                  onClick={() => setEditorTab("design")} 
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium border-b-2 transition-all ${
                    editorTab === "design" 
                      ? "border-[var(--color-primary)] text-[var(--color-primary)]" 
                      : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <Palette className="h-4 w-4" /> {t("visualTemplate")}
                </button>
                <button 
                  onClick={() => setEditorTab("content")} 
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium border-b-2 transition-all ${
                    editorTab === "content" 
                      ? "border-[var(--color-primary)] text-[var(--color-primary)]" 
                      : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <Settings className="h-4 w-4" /> {t("quickContent")}
                </button>
              </div>

              {/* SEKMELİ KISIM 1: GÖRSEL ŞABLON & STİL */}
              {editorTab === "design" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Şablon Seçici */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 font-bold mb-4 text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                      <Layout className="h-4 w-4 text-[var(--color-primary)]" /> {t("templateChoice")}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <button
                        onClick={() => setTemplateName("modern")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                          templateName === "modern"
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 font-semibold text-[var(--color-primary)] shadow-sm"
                            : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50"
                        }`}
                      >
                        <span className="text-xl mb-1">📊</span>
                        <span className="text-xs">{t("modern")}</span>
                      </button>

                      <button
                        onClick={() => setTemplateName("classic")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                          templateName === "classic"
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 font-semibold text-[var(--color-primary)] shadow-sm"
                            : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50"
                        }`}
                      >
                        <span className="text-xl mb-1">📄</span>
                        <span className="text-xs">{t("classic")}</span>
                      </button>

                      <button
                        onClick={() => setTemplateName("brutalist")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                          templateName === "brutalist"
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 font-semibold text-[var(--color-primary)] shadow-sm"
                            : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50"
                        }`}
                      >
                        <span className="text-xl mb-1">⚡</span>
                        <span className="text-xs">{t("brutalist")}</span>
                      </button>
                    </div>
                  </div>

                  {/* Renk Paleti */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 font-bold mb-4 text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                      <Palette className="h-4 w-4 text-[var(--color-primary)]" /> {t("themeColor")}
                    </h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {colorPalettes.map((cp) => (
                        <button
                          key={cp.value}
                          onClick={() => setPrimaryColor(cp.value)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition-all ${
                            primaryColor === cp.value
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 font-semibold"
                              : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50"
                          }`}
                        >
                          <span className="h-4 w-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: cp.value }} />
                          <span className="text-xs">{cp.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
 
                  {/* Bilgilendirme */}
                  <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 p-5 text-center">
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {isEn 
                        ? "The primary source of your profile and CV information is at " 
                        : "Profil ve CV bilgilerinizin ana kaydı "}
                      <Link href="/profile/edit" className="text-[var(--color-primary)] font-semibold hover:underline">/profile/edit</Link> 
                      {isEn 
                        ? ". You can permanently change your information from that page. The editor here allows quick last-minute adjustments." 
                        : " adresindedir. Bu sayfadan bilgilerinizi kalıcı olarak değiştirebilirsiniz. Buradaki içerik editörü ise hızlı son dakika düzenlemeleri yapmanızı sağlar."}
                    </p>
                  </div>
                </div>
              )}

              {/* SEKMELİ KISIM 2: İÇERİK EDİTÖRÜ (HIZLI EDİT) */}
              {editorTab === "content" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Hakkımda (Bio) */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 font-bold mb-3 text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                      Hakkımda Metni
                    </h2>
                    <textarea 
                      value={bio} 
                      onChange={e => setBio(e.target.value)} 
                      rows={3} 
                      maxLength={500} 
                      className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none" 
                      placeholder="Özgeçmiş özet metni..."
                    />
                  </div>

                  {/* Eğitim Editörü */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="flex items-center gap-2 font-bold text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                        <GraduationCap className="h-4.5 w-4.5" /> Eğitim
                      </h2>
                      <button onClick={addEducation} className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-0.5">
                        <Plus className="h-3.5 w-3.5" /> Ekle
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {education.map((edu, index) => (
                        <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-background)] shadow-sm">
                          <button onClick={() => removeEducation(index)} className="absolute top-2 right-2 text-[var(--color-muted-foreground)] hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="space-y-2">
                            <input value={edu.school} onChange={e => updateEducation(index, 'school', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Okul / Üniversite" />
                            <input value={edu.department} onChange={e => updateEducation(index, 'department', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Bölüm / Alan" />
                            <div className="grid grid-cols-2 gap-2">
                              <input value={edu.startYear} onChange={e => updateEducation(index, 'startYear', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Başlangıç" />
                              <input value={edu.endYear} onChange={e => updateEducation(index, 'endYear', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Bitiş / Devam" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deneyim Editörü */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="flex items-center gap-2 font-bold text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                        <Briefcase className="h-4.5 w-4.5" /> Deneyim
                      </h2>
                      <button onClick={addExperience} className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-0.5">
                        <Plus className="h-3.5 w-3.5" /> Ekle
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {experience.map((exp, index) => (
                        <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-background)] shadow-sm">
                          <button onClick={() => removeExperience(index)} className="absolute top-2 right-2 text-[var(--color-muted-foreground)] hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="space-y-2">
                            <input value={exp.company} onChange={e => updateExperience(index, 'company', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Şirket / Kurum" />
                            <input value={exp.position} onChange={e => updateExperience(index, 'position', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Pozisyon" />
                            <input value={exp.duration} onChange={e => updateExperience(index, 'duration', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Süre (Örn: 2022 - 2023)" />
                            <textarea rows={2} value={exp.description} onChange={e => updateExperience(index, 'description', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)] resize-none" placeholder="Açıklama" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Yetenekler */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 font-bold mb-3 text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                      <Award className="h-4.5 w-4.5" /> Yetenekler
                    </h2>
                    <div className="flex gap-2">
                      <input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                        className="flex-1 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                        placeholder="Yetenek ekle..."
                      />
                      <button onClick={addSkill} className="rounded-xl bg-[var(--color-primary)] px-3 text-white hover:opacity-90">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {skills.map((skill) => (
                          <span key={skill} className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)]/10 px-2 py-1 text-xs font-semibold text-[var(--color-primary)]">
                            {skill}
                            <button onClick={() => removeSkill(skill)}><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Diller */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="flex items-center gap-2 font-bold text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                        <Languages className="h-4.5 w-4.5" /> Diller
                      </h2>
                      <button onClick={addLanguage} className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-0.5">
                        <Plus className="h-3.5 w-3.5" /> Ekle
                      </button>
                    </div>
                    <div className="space-y-2">
                      {languages.map((lang, index) => (
                        <div key={index} className="flex items-center gap-2 bg-[var(--color-background)] p-2 rounded-xl border border-[var(--color-border)]">
                          <input value={lang.language} onChange={e => updateLanguage(index, 'language', e.target.value)} className="flex-1 min-w-0 rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Dil" />
                          <select value={lang.level} onChange={e => updateLanguage(index, 'level', e.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-primary)]">
                            <option value="beginner">A1/A2</option>
                            <option value="intermediate">B1/B2</option>
                            <option value="advanced">C1/C2</option>
                            <option value="native">Anadil</option>
                          </select>
                          <button onClick={() => removeLanguage(index)} className="text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sertifikalar */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="flex items-center gap-2 font-bold text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                        <CertificateIcon className="h-4.5 w-4.5" /> Sertifikalar
                      </h2>
                      <button onClick={addCertification} className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-0.5">
                        <Plus className="h-3.5 w-3.5" /> Ekle
                      </button>
                    </div>
                    <div className="space-y-3">
                      {certifications.map((cert, index) => (
                        <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-3 bg-[var(--color-background)] shadow-sm">
                          <button onClick={() => removeCertification(index)} className="absolute top-2 right-2 text-[var(--color-muted-foreground)] hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="space-y-1.5">
                            <input value={cert.name} onChange={e => updateCertification(index, 'name', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Sertifika Adı" />
                            <input value={cert.issuer} onChange={e => updateCertification(index, 'issuer', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Veren Kurum" />
                            <input value={cert.date} onChange={e => updateCertification(index, 'date', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Tarih" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* SAĞ KOLON: Canlı Önizleme (7 Column) */}
            <div className="lg:col-span-7 rounded-2xl border border-[var(--color-border)] bg-white shadow-sm dark:bg-[var(--color-card)] lg:sticky top-6 p-8 overflow-hidden min-h-[600px]">
              
              <div className="mb-6 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <h2 className="flex items-center gap-2 font-bold text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                  <Eye className="h-4 w-4" /> Canlı Web Önizlemesi
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs rounded-full bg-[var(--color-muted)] px-3 py-1 font-semibold border border-[var(--color-border)]">
                    Şablon: {templateName.toUpperCase()}
                  </span>
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                </div>
              </div>

              {/* DİNAMİK CANLI ŞABLON RENDER ALANI */}
              
              {/* CV Header */}
              <div className="border-b border-[var(--color-border)] pb-6 mb-6">
                <h3 className={`text-2xl font-bold text-[var(--color-foreground)] ${templateName === 'brutalist' ? 'uppercase tracking-wide font-black' : ''}`}>
                  {profile?.first_name} {profile?.last_name}
                </h3>
                <p className="text-sm font-semibold mt-1" style={{ color: primaryColor }}>
                  {profile?.department || "Yönetim Bilişim Sistemleri Öğrencisi"}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--color-muted-foreground)]">
                  {profile?.edu_email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {profile.edu_email}</span>}
                  {profile?.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>}
                  {profile?.linkedin_url && <span className="flex items-center gap-1"><Link2 className="h-3.5 w-3.5" /> LinkedIn</span>}
                  {profile?.github_url && <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> GitHub</span>}
                </div>
              </div>

              {/* Şablona Göre İçerik Dağılımı */}
              {templateName === 'modern' ? (
                // MODERN: ÇİFT SÜTUNLU DÜZEN
                <div className="grid gap-6 sm:grid-cols-12">
                  
                  {/* Sol Küçük Sütun */}
                  <div className="sm:col-span-4 space-y-6 border-r border-[var(--color-border)] pr-4">
                    {/* Yetenekler */}
                    {skills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>Yetenekler</h4>
                        <div className="flex flex-wrap gap-1">
                          {skills.map((skill) => (
                            <span key={skill} className="rounded-lg bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-foreground)] border border-[var(--color-border)]">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Diller */}
                    {languages.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>Diller</h4>
                        <div className="space-y-2">
                          {languages.map((lang, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="font-semibold">{lang.language}</span>
                              <span className="text-[var(--color-muted-foreground)] text-[10px] bg-[var(--color-muted)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">{getLanguageLevelLabel(lang.level)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sağ Geniş Sütun */}
                  <div className="sm:col-span-8 space-y-6">
                    {/* Hakkımda */}
                    {bio && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: primaryColor }}>Hakkımda</h4>
                        <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{bio}</p>
                      </div>
                    )}

                    {/* Deneyim */}
                    {experience.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>Deneyim</h4>
                        <div className="space-y-4">
                          {experience.map((exp, i) => (
                            <div key={i} className="text-xs">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-[var(--color-foreground)]">{exp.position}</span>
                                <span className="text-[10px] text-[var(--color-muted-foreground)]">{exp.duration}</span>
                              </div>
                              <div className="text-[11px] font-semibold text-[var(--color-muted-foreground)] mb-1">{exp.company}</div>
                              {exp.description && <p className="text-[11px] text-[var(--color-muted-foreground)] leading-normal">{exp.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Eğitim */}
                    {education.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>Eğitim</h4>
                        <div className="space-y-3">
                          {education.map((edu, i) => (
                            <div key={i} className="text-xs">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-[var(--color-foreground)]">{edu.school}</span>
                                <span className="text-[10px] text-[var(--color-muted-foreground)]">{edu.startYear} - {edu.endYear}</span>
                              </div>
                              <div className="text-[11px] text-[var(--color-muted-foreground)]">{edu.department}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sertifikalar */}
                    {certifications.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>Sertifikalar</h4>
                        <div className="space-y-3">
                          {certifications.map((cert, i) => (
                            <div key={i} className="text-xs">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-[var(--color-foreground)]">{cert.name}</span>
                                <span className="text-[10px] text-[var(--color-muted-foreground)]">{cert.date}</span>
                              </div>
                              <div className="text-[11px] text-[var(--color-muted-foreground)]">{cert.issuer}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                // CLASSIC VE BRUTALIST: TEK SÜTUNLU AKIŞ DÜZENİ
                <div className={`space-y-6 ${templateName === 'brutalist' ? 'brutalist-preview border-l-2 border-black pl-4' : ''}`}>
                  {/* Hakkımda */}
                  {bio && (
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${templateName === 'brutalist' ? 'border-b border-black pb-1 mb-3' : ''}`} style={{ color: templateName === 'brutalist' ? '#000000' : primaryColor }}>Hakkımda</h4>
                      <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">{bio}</p>
                    </div>
                  )}

                  {/* Deneyim */}
                  {experience.length > 0 && (
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${templateName === 'brutalist' ? 'border-b border-black pb-1 mb-4' : ''}`} style={{ color: templateName === 'brutalist' ? '#000000' : primaryColor }}>Deneyim</h4>
                      <div className="space-y-4">
                        {experience.map((exp, i) => (
                          <div key={i} className="text-xs">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-[var(--color-foreground)]">{exp.position}</span>
                              <span className="text-[10px] text-[var(--color-muted-foreground)]">{exp.duration}</span>
                            </div>
                            <div className="text-[11px] font-semibold text-[var(--color-muted-foreground)] mb-1">{exp.company}</div>
                            {exp.description && <p className="text-[11px] text-[var(--color-muted-foreground)] leading-normal">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eğitim */}
                  {education.length > 0 && (
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${templateName === 'brutalist' ? 'border-b border-black pb-1 mb-4' : ''}`} style={{ color: templateName === 'brutalist' ? '#000000' : primaryColor }}>Eğitim</h4>
                      <div className="space-y-3">
                        {education.map((edu, i) => (
                          <div key={i} className="text-xs">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-[var(--color-foreground)]">{edu.school}</span>
                              <span className="text-[10px] text-[var(--color-muted-foreground)]">{edu.startYear} - {edu.endYear}</span>
                            </div>
                            <div className="text-[11px] text-[var(--color-muted-foreground)]">{edu.department}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Yetenekler */}
                  {skills.length > 0 && (
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${templateName === 'brutalist' ? 'border-b border-black pb-1 mb-3' : ''}`} style={{ color: templateName === 'brutalist' ? '#000000' : primaryColor }}>Yetenekler</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((skill) => (
                          <span key={skill} className={`rounded px-2 py-0.5 text-xs text-[var(--color-foreground)] border border-[var(--color-border)] ${templateName === 'brutalist' ? 'border-black bg-white rounded-none font-bold' : 'bg-[var(--color-muted)]'}`}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Diller */}
                  {languages.length > 0 && (
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${templateName === 'brutalist' ? 'border-b border-black pb-1 mb-4' : ''}`} style={{ color: templateName === 'brutalist' ? '#000000' : primaryColor }}>Diller</h4>
                      <div className="grid grid-cols-2 gap-2 max-w-sm">
                        {languages.map((lang, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="font-semibold">{lang.language}</span>
                            <span className="text-[10px] text-[var(--color-muted-foreground)] bg-[var(--color-muted)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">{getLanguageLevelLabel(lang.level)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sertifikalar */}
                  {certifications.length > 0 && (
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${templateName === 'brutalist' ? 'border-b border-black pb-1 mb-4' : ''}`} style={{ color: templateName === 'brutalist' ? '#000000' : primaryColor }}>Sertifikalar</h4>
                      <div className="space-y-3">
                        {certifications.map((cert, i) => (
                          <div key={i} className="text-xs">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-[var(--color-foreground)]">{cert.name}</span>
                              <span className="text-[10px] text-[var(--color-muted-foreground)]">{cert.date}</span>
                            </div>
                            <div className="text-[11px] text-[var(--color-muted-foreground)]">{cert.issuer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      </main>
      
      {/* Brutalist şablon için web önizleme stilleri (sadece preview alanı için geçerli) */}
      <style jsx global>{`
        .brutalist-preview {
          border-left: 3px solid #000000 !important;
          border-radius: 0px !important;
        }
      `}</style>
    </div>
  );
}
