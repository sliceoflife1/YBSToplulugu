"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus, X, Download, Eye, Save, GraduationCap, Briefcase, Award, Languages,
  Trash2, Award as CertificateIcon, Palette, Layout, Settings, Mail, Phone, Link2, Globe,
  MapPin, FolderGit2, Users, FileStack
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import type { Profile, CvData, CvEducation, CvExperience, CvCertification, CvLanguage, CvProject, CvReference, CvCustomSection } from "@/types/database";
import { normalizeEducationList, normalizeExperienceList, parseJsonArray, formatDateRange } from "@/lib/cv/normalize";
import CvWebPreview from "@/components/cv/cv-web-preview";


function formatUrlLabel(url: string) {
  if (!url) return "";
  return url.replace(/https?:\/\/(www\.)?/, "");
}

export default function CvBuilderPage() {
  const t = useTranslations("cv");
  const locale = useLocale();
  const isEn = locale === "en";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvData, setCvData] = useState<CvData | null>(null);

  // Şablon ve Tema Renk Durumları
  const [templateName, setTemplateName] = useState<string>("modern");
  const [primaryColor, setPrimaryColor] = useState<string>("#3B82F6");

  // Kişisel / Özet Bilgiler (profile.edit ile senkronize, buradan da hızlıca düzenlenebilir)
  const [bio, setBio] = useState<string>("");
  const [headline, setHeadline] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");

  // Dinamik Diziler
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [education, setEducation] = useState<CvEducation[]>([]);
  const [experience, setExperience] = useState<CvExperience[]>([]);
  const [certifications, setCertifications] = useState<CvCertification[]>([]);
  const [languages, setLanguages] = useState<CvLanguage[]>([]);
  const [projects, setProjects] = useState<CvProject[]>([]);
  const [references, setReferences] = useState<CvReference[]>([]);
  const [customSections, setCustomSections] = useState<CvCustomSection[]>([]);

  // Editör Sekme Yönetimi
  const [editorTab, setEditorTab] = useState<"content" | "extra">("content");

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
        setHeadline(profileRes.data.headline || "");
        setLocation(profileRes.data.location || "");
        setWebsiteUrl(profileRes.data.website_url || "");
      }

      if (cvRes.data) {
        setCvData(cvRes.data);
        setSkills(cvRes.data.skills || []);

        // Veritabanından gelen şablon tercihlerini ata (varsayılan: modern, #3B82F6)
        setTemplateName(cvRes.data.template_name || "modern");
        setPrimaryColor(cvRes.data.primary_color || "#3B82F6");

        setEducation(normalizeEducationList(cvRes.data.education));
        setExperience(normalizeExperienceList(cvRes.data.experience));
        setCertifications(parseJsonArray<CvCertification>(cvRes.data.certifications));
        setLanguages(parseJsonArray<CvLanguage>(cvRes.data.languages));
        setProjects(parseJsonArray<CvProject>(cvRes.data.projects));
        setReferences(parseJsonArray<CvReference>(cvRes.data.references));
        setCustomSections(parseJsonArray<CvCustomSection>(cvRes.data.custom_sections));
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
    setEducation([...education, { school: "", degree: "", field: "", location: "", gpa: "", description: "", startDate: "", endDate: "", current: false }]);
  };
  const updateEducation = (index: number, field: string, value: string | boolean) => {
    const newEdu = [...education];
    newEdu[index] = { ...newEdu[index], [field]: value } as CvEducation;
    setEducation(newEdu);
  };
  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Experience Handlers
  const addExperience = () => {
    setExperience([...experience, { company: "", title: "", location: "", description: "", startDate: "", endDate: "", current: false }]);
  };
  const updateExperience = (index: number, field: string, value: string | boolean) => {
    const newExp = [...experience];
    newExp[index] = { ...newExp[index], [field]: value } as CvExperience;
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
    newLangs[index] = { ...newLangs[index], [field]: value } as CvLanguage;
    setLanguages(newLangs);
  };
  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  // Certification Handlers
  const addCertification = () => {
    setCertifications([...certifications, { name: "", issuer: "", date: "", url: "" }]);
  };
  const updateCertification = (index: number, field: string, value: string) => {
    const newCerts = [...certifications];
    newCerts[index] = { ...newCerts[index], [field]: value } as CvCertification;
    setCertifications(newCerts);
  };
  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Project Handlers
  const addProject = () => {
    setProjects([...projects, { title: "", description: "", technologies: [], url: "", date: "" }]);
  };
  const updateProject = (index: number, field: string, value: string) => {
    const newProjects = [...projects];
    if (field === "technologies") {
      newProjects[index] = { ...newProjects[index], technologies: value.split(",").map((s) => s.trim()).filter(Boolean) };
    } else {
      newProjects[index] = { ...newProjects[index], [field]: value } as CvProject;
    }
    setProjects(newProjects);
  };
  const removeProject = (index: number) => setProjects(projects.filter((_, i) => i !== index));

  // Reference Handlers
  const addReference = () => {
    setReferences([...references, { name: "", position: "", company: "", email: "", phone: "" }]);
  };
  const updateReference = (index: number, field: string, value: string) => {
    const newRefs = [...references];
    newRefs[index] = { ...newRefs[index], [field]: value } as CvReference;
    setReferences(newRefs);
  };
  const removeReference = (index: number) => setReferences(references.filter((_, i) => i !== index));

  // Custom Section Handlers
  const addCustomSection = () => {
    setCustomSections([...customSections, { title: "", items: [] }]);
  };
  const updateCustomSectionTitle = (index: number, value: string) => {
    const newSections = [...customSections];
    newSections[index] = { ...newSections[index], title: value };
    setCustomSections(newSections);
  };
  const updateCustomSectionItems = (index: number, value: string) => {
    const newSections = [...customSections];
    newSections[index] = { ...newSections[index], items: value.split("\n").map((s) => s.trim()).filter(Boolean) };
    setCustomSections(newSections);
  };
  const removeCustomSection = (index: number) => setCustomSections(customSections.filter((_, i) => i !== index));

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
      projects,
      references,
      custom_sections: customSections,
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

    // Ayrıca kişisel özet bilgilerini (bio, unvan, konum, web sitesi) profile tablosuna kaydet
    const profileChanges: Record<string, string> = {};
    if (bio !== (profile.bio || "")) profileChanges.bio = bio;
    if (headline !== (profile.headline || "")) profileChanges.headline = headline;
    if (location !== (profile.location || "")) profileChanges.location = location;
    if (websiteUrl !== (profile.website_url || "")) profileChanges.website_url = websiteUrl;

    if (Object.keys(profileChanges).length > 0) {
      await supabase.from("profiles").update(profileChanges).eq("id", profile.id);
      setProfile({ ...profile, ...profileChanges } as Profile);
    }

    if (error) {
      toast.error("Kaydetme sırasında bir hata oluştu");
    } else {
      toast.success("CV ve şablon tercihleriniz başarıyla kaydedildi!");
    }
    setSaving(false);
  };

  const handleDownloadPdf = async () => {
    if (!profile) return;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/cv/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { ...profile, bio, headline, location, website_url: websiteUrl },
          skills,
          education,
          experience,
          certifications,
          languages,
          projects,
          references,
          customSections,
          templateName,
          primaryColor,
        }),
      });

      if (!res.ok) throw new Error("PDF oluşturulamadı");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV_${profile.first_name}_${profile.last_name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(isEn ? "An error occurred while preparing the PDF. Please try again." : "PDF hazırlanırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setPdfLoading(false);
    }
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

              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading || !profile}
                className="flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 shadow-md transition-all disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {pdfLoading ? "PDF Hazırlanıyor..." : "PDF İndir"}
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 items-start">

            {/* SOL KOLON: Düzenleyici ve Tasarım Ayarları (5 Column) */}
            <div className="lg:col-span-5 space-y-6">

              {/* Sekme Seçici */}
              <div className="flex border-b border-[var(--color-border)] pb-px gap-1">
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
                <button
                  onClick={() => setEditorTab("extra")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium border-b-2 transition-all ${
                    editorTab === "extra"
                      ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                      : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <FileStack className="h-4 w-4" /> {isEn ? "Extra Sections" : "Ek Bölümler"}
                </button>
              </div>

              <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 p-5 text-center mt-6">
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

              {/* SEKMELİ KISIM 2: İÇERİK EDİTÖRÜ (HIZLI EDİT) */}
              {editorTab === "content" && (
                <div className="space-y-6 animate-fade-in">

                  {/* Kişisel Özet Bilgileri */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm space-y-3">
                    <h2 className="flex items-center gap-2 font-bold mb-1 text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                      Kişisel Özet Bilgileri
                    </h2>
                    <div>
                      <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">Unvan / Başlık</label>
                      <input value={headline} onChange={e => setHeadline(e.target.value)} maxLength={120} className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: Frontend Developer Adayı" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">Konum</label>
                      <input value={location} onChange={e => setLocation(e.target.value)} maxLength={120} className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: İzmir, Türkiye" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">Kişisel Web Sitesi</label>
                      <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">Hakkımda Metni</label>
                      <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="Özgeçmiş özet metni..."
                      />
                    </div>
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
                            <div className="grid grid-cols-2 gap-2">
                              <input value={edu.degree || ""} onChange={e => updateEducation(index, 'degree', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Derece (Lisans, Yüksek Lisans...)" />
                              <input value={edu.field || ""} onChange={e => updateEducation(index, 'field', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Bölüm / Alan" />
                            </div>
                            <input value={edu.location || ""} onChange={e => updateEducation(index, 'location', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Konum (Şehir)" />
                            <div className="grid grid-cols-2 gap-2">
                              <input value={edu.startDate} onChange={e => updateEducation(index, 'startDate', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Başlangıç (Örn: 2022)" />
                              <input value={edu.endDate || ""} disabled={edu.current} onChange={e => updateEducation(index, 'endDate', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50" placeholder="Bitiş (Örn: 2026)" />
                            </div>
                            <label className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                              <input type="checkbox" checked={Boolean(edu.current)} onChange={e => updateEducation(index, 'current', e.target.checked)} /> Halen devam ediyorum
                            </label>
                            <input value={edu.gpa || ""} onChange={e => updateEducation(index, 'gpa', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Not Ortalaması (Opsiyonel)" />
                            <textarea rows={2} value={edu.description || ""} onChange={e => updateEducation(index, 'description', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)] resize-none" placeholder="Ek açıklama (Opsiyonel)" />
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
                            <input value={exp.title} onChange={e => updateExperience(index, 'title', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Pozisyon" />
                            <input value={exp.location || ""} onChange={e => updateExperience(index, 'location', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Konum (Şehir / Uzaktan)" />
                            <div className="grid grid-cols-2 gap-2">
                              <input value={exp.startDate} onChange={e => updateExperience(index, 'startDate', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Başlangıç (Örn: Haz 2023)" />
                              <input value={exp.endDate || ""} disabled={exp.current} onChange={e => updateExperience(index, 'endDate', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50" placeholder="Bitiş" />
                            </div>
                            <label className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                              <input type="checkbox" checked={Boolean(exp.current)} onChange={e => updateExperience(index, 'current', e.target.checked)} /> Halen bu pozisyondayım
                            </label>
                            <textarea rows={2} value={exp.description || ""} onChange={e => updateExperience(index, 'description', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)] resize-none" placeholder="Açıklama (her satır bir madde olarak gösterilir)" />
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
                            <div className="grid grid-cols-2 gap-2">
                              <input value={cert.date || ""} onChange={e => updateCertification(index, 'date', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Tarih" />
                              <input value={cert.url || ""} onChange={e => updateCertification(index, 'url', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Doğrulama Linki" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* SEKMELİ KISIM 3: EK BÖLÜMLER (PROJELER, REFERANSLAR, ÖZEL BÖLÜMLER) */}
              {editorTab === "extra" && (
                <div className="space-y-6 animate-fade-in">

                  {/* Projeler */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="flex items-center gap-2 font-bold text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                        <FolderGit2 className="h-4.5 w-4.5" /> Projeler
                      </h2>
                      <button onClick={addProject} className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-0.5">
                        <Plus className="h-3.5 w-3.5" /> Ekle
                      </button>
                    </div>
                    <div className="space-y-4">
                      {projects.map((proj, index) => (
                        <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-background)] shadow-sm">
                          <button onClick={() => removeProject(index)} className="absolute top-2 right-2 text-[var(--color-muted-foreground)] hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="space-y-2">
                            <input value={proj.title} onChange={e => updateProject(index, 'title', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Proje Başlığı" />
                            <textarea rows={2} value={proj.description || ""} onChange={e => updateProject(index, 'description', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)] resize-none" placeholder="Açıklama" />
                            <input value={(proj.technologies || []).join(", ")} onChange={e => updateProject(index, 'technologies', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Teknolojiler (virgülle ayırın)" />
                            <div className="grid grid-cols-2 gap-2">
                              <input value={proj.date || ""} onChange={e => updateProject(index, 'date', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Tarih" />
                              <input value={proj.url || ""} onChange={e => updateProject(index, 'url', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Bağlantı" />
                            </div>
                          </div>
                        </div>
                      ))}
                      {projects.length === 0 && (
                        <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">Henüz proje eklenmedi. Ayrıca <Link href="/projects" className="text-[var(--color-primary)] font-semibold hover:underline">Projeler</Link> sayfanızdaki çalışmalarınızı buraya özetleyebilirsiniz.</p>
                      )}
                    </div>
                  </div>

                  {/* Referanslar */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="flex items-center gap-2 font-bold text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                        <Users className="h-4.5 w-4.5" /> Referanslar
                      </h2>
                      <button onClick={addReference} className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-0.5">
                        <Plus className="h-3.5 w-3.5" /> Ekle
                      </button>
                    </div>
                    <div className="space-y-4">
                      {references.map((ref, index) => (
                        <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-background)] shadow-sm">
                          <button onClick={() => removeReference(index)} className="absolute top-2 right-2 text-[var(--color-muted-foreground)] hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="space-y-2">
                            <input value={ref.name} onChange={e => updateReference(index, 'name', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Ad Soyad" />
                            <div className="grid grid-cols-2 gap-2">
                              <input value={ref.position || ""} onChange={e => updateReference(index, 'position', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Pozisyon" />
                              <input value={ref.company || ""} onChange={e => updateReference(index, 'company', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Kurum" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input value={ref.email || ""} onChange={e => updateReference(index, 'email', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="E-posta" />
                              <input value={ref.phone || ""} onChange={e => updateReference(index, 'phone', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]" placeholder="Telefon" />
                            </div>
                          </div>
                        </div>
                      ))}
                      {references.length === 0 && (
                        <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">Henüz referans eklenmedi.</p>
                      )}
                    </div>
                  </div>

                  {/* Özel Bölümler */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="flex items-center gap-2 font-bold text-sm tracking-wider uppercase text-[var(--color-muted-foreground)]">
                        <FileStack className="h-4.5 w-4.5" /> Özel Bölümler
                      </h2>
                      <button onClick={addCustomSection} className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-0.5">
                        <Plus className="h-3.5 w-3.5" /> Ekle
                      </button>
                    </div>
                    <div className="space-y-4">
                      {customSections.map((section, index) => (
                        <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-background)] shadow-sm">
                          <button onClick={() => removeCustomSection(index)} className="absolute top-2 right-2 text-[var(--color-muted-foreground)] hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="space-y-2">
                            <input value={section.title} onChange={e => updateCustomSectionTitle(index, e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[var(--color-primary)]" placeholder="Bölüm Başlığı (Örn: Gönüllülük Çalışmaları)" />
                            <textarea rows={3} value={(section.items || []).join("\n")} onChange={e => updateCustomSectionItems(index, e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)] resize-none" placeholder={"Her satıra bir madde yazın"} />
                          </div>
                        </div>
                      ))}
                      {customSections.length === 0 && (
                        <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">İstediğiniz herhangi bir başlıkla (Gönüllülük, Yayınlar, Ödüller vb.) özel bölüm ekleyebilirsiniz.</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* SAĞ KOLON: Canlı Önizleme & Şablon Seçici (7 Column) */}
            <div className="lg:col-span-7 space-y-6 lg:sticky top-6">
              {/* Şablon & Renk Seçim Paneli */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-bold tracking-wider uppercase text-[var(--color-muted-foreground)] flex items-center justify-between">
                  <span>🎨 CV Şablonu ve Renk Paleti</span>
                  <span className="text-xs font-normal normal-case text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200">
                    Canlı Önizleme
                  </span>
                </h2>

                {/* 4 Şablon Seçim Kartı */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setTemplateName("standard")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      templateName === "standard"
                        ? "border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10 ring-2 ring-[var(--color-primary)]/20 font-bold"
                        : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-slate-400"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block text-[var(--color-foreground)]">🌐 Standart</span>
                      <span className="text-[10px] text-[var(--color-muted-foreground)] block mt-0.5">Topluluk Mimarisi (2 Kolon)</span>
                    </div>
                    {templateName === "standard" && <span className="text-[10px] text-[var(--color-primary)] font-bold mt-2">✓ Seçili</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateName("corporate")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      templateName === "corporate"
                        ? "border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10 ring-2 ring-[var(--color-primary)]/20 font-bold"
                        : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-slate-400"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block text-[var(--color-foreground)]">🏛️ Kurumsal</span>
                      <span className="text-[10px] text-[var(--color-muted-foreground)] block mt-0.5">Klasik & Çizgili (Tek Kolon)</span>
                    </div>
                    {templateName === "corporate" && <span className="text-[10px] text-[var(--color-primary)] font-bold mt-2">✓ Seçili</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateName("modern")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      templateName === "modern"
                        ? "border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10 ring-2 ring-[var(--color-primary)]/20 font-bold"
                        : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-slate-400"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block text-[var(--color-foreground)]">🎨 Modern</span>
                      <span className="text-[10px] text-[var(--color-muted-foreground)] block mt-0.5">Renkli Kartlar (2 Kolon)</span>
                    </div>
                    {templateName === "modern" && <span className="text-[10px] text-[var(--color-primary)] font-bold mt-2">✓ Seçili</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateName("academic")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      templateName === "academic"
                        ? "border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10 ring-2 ring-[var(--color-primary)]/20 font-bold"
                        : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-slate-400"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block text-[var(--color-foreground)]">🎓 Akademik / ATS</span>
                      <span className="text-[10px] text-[var(--color-muted-foreground)] block mt-0.5">Sade & Siyah-Beyaz</span>
                    </div>
                    {templateName === "academic" && <span className="text-[10px] text-[var(--color-primary)] font-bold mt-2">✓ Seçili</span>}
                  </button>
                </div>

                {/* Renk Paleti Seçici */}
                <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-border)]">
                  <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">Vurgu Rengi:</span>
                  <div className="flex items-center gap-2">
                    {[
                      { name: "Mavi", hex: "#0ea5e9" },
                      { name: "Lacivert", hex: "#1e3a8a" },
                      { name: "Zümrüt", hex: "#059669" },
                      { name: "Bordo", hex: "#9f1239" },
                      { name: "Kömür", hex: "#334155" },
                    ].map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setPrimaryColor(color.hex)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          primaryColor === color.hex ? "scale-125 ring-2 ring-offset-2 ring-slate-400" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Canlı HTML/Tailwind Önizleme Bileşeni */}
              {profile && (
                <CvWebPreview
                  profile={{ ...profile, bio, headline, location, website_url: websiteUrl }}
                  skills={skills}
                  education={education.map((e) => ({
                    school: e.school,
                    degree: e.degree,
                    field: e.field,
                    start_date: e.startDate,
                    startDate: e.startDate,
                    end_date: e.endDate,
                    endDate: e.endDate,
                    current: e.current,
                    description: e.description,
                    gpa: e.gpa,
                  }))}
                  experience={experience.map((e) => ({
                    company: e.company,
                    position: e.title,
                    title: e.title,
                    location: e.location,
                    start_date: e.startDate,
                    startDate: e.startDate,
                    end_date: e.endDate,
                    endDate: e.endDate,
                    current: e.current,
                    description: e.description,
                  }))}
                  certifications={certifications.map((c) => ({
                    name: c.name,
                    issuer: c.issuer,
                    issue_date: c.date,
                    credential_id: c.url,
                  }))}
                  languages={languages.map((l) => ({
                    name: l.language,
                    language: l.language,
                    level: l.level,
                  }))}
                  projects={projects.map((p) => ({
                    title: p.title,
                    description: p.description,
                    project_url: p.url,
                    start_date: p.date,
                  }))}
                  references={references.map((r) => ({
                    name: r.name,
                    title: r.position,
                    company: r.company,
                    contact: [r.email, r.phone].filter(Boolean).join(" • "),
                  }))}
                  customSections={customSections}
                  templateName={templateName}
                  primaryColor={primaryColor}
                />
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

