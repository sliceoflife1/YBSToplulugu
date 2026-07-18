"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft, User, Mail, Phone, BookOpen, Link2, Globe, Eye, EyeOff,
  GraduationCap, Briefcase, Award, Languages, Plus, Trash2, Award as CertificateIcon, Save,
  MapPin, Briefcase as HeadlineIcon, FolderGit2, Users, FileStack
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations/profile";
import type { Profile, CvData, CvEducation, CvExperience, CvCertification, CvLanguage, CvProject, CvReference, CvCustomSection } from "@/types/database";
import { DEU_FACULTIES } from "@/constants/deu-departments";
import { useLocale } from "next-intl";
import { normalizeEducationList, normalizeExperienceList, parseJsonArray } from "@/lib/cv/normalize";

export default function ProfileEditPage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === "en";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");

  // Sekme yönetimi
  const [activeTab, setActiveTab] = useState<"personal" | "edu-exp" | "skills-more" | "extra" | "mentorship">("personal");

  // Dinamik CV Dizileri ve Mentorlük
  const [mentorTopics, setMentorTopics] = useState<string[]>([]);
  const [mentorTopicInput, setMentorTopicInput] = useState("");

  // Dinamik CV Dizileri
  const [education, setEducation] = useState<CvEducation[]>([]);
  const [experience, setExperience] = useState<CvExperience[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [certifications, setCertifications] = useState<CvCertification[]>([]);
  const [languages, setLanguages] = useState<CvLanguage[]>([]);
  const [projects, setProjects] = useState<CvProject[]>([]);
  const [references, setReferences] = useState<CvReference[]>([]);
  const [customSections, setCustomSections] = useState<CvCustomSection[]>([]);

  // Dil seviyeleri
  const languageLevels = [
    { value: "beginner", label: isEn ? "Beginner (A1-A2)" : "Başlangıç (A1-A2)" },
    { value: "intermediate", label: isEn ? "Intermediate (B1-B2)" : "Orta (B1-B2)" },
    { value: "advanced", label: isEn ? "Advanced (C1-C2)" : "İleri (C1-C2)" },
    { value: "native", label: isEn ? "Native" : "Anadil" }
  ];

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
  });

  useEffect(() => {
    const supabase = createClient();
    async function loadAllData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [profileRes, cvRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
        supabase.from("cv_data").select("*").eq("user_id", user.id).single<CvData>(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);

        // Kullanıcının kayıtlı bölümünden fakülteyi bul
        if (profileRes.data.department) {
          const foundFaculty = DEU_FACULTIES.find(fac =>
            fac.departments.some(dept => dept.name === profileRes.data.department)
          );
          if (foundFaculty) {
            setSelectedFaculty(foundFaculty.name);
          }
        }

        reset({
          firstName: profileRes.data.first_name,
          lastName: profileRes.data.last_name,
          headline: profileRes.data.headline || "",
          bio: profileRes.data.bio || "",
          phone: profileRes.data.phone || "",
          department: profileRes.data.department || "",
          location: profileRes.data.location || "",
          linkedinUrl: profileRes.data.linkedin_url || "",
          githubUrl: profileRes.data.github_url || "",
          websiteUrl: profileRes.data.website_url || "",
          personalEmail: profileRes.data.personal_email || "",
          isCvPublic: profileRes.data.is_cv_public,
          isOpenToWork: profileRes.data.is_open_to_work || false,
          meetingUrl: profileRes.data.meeting_url || "",
          isMentor: profileRes.data.is_mentor || false,
        });

        setMentorTopics(profileRes.data.mentor_topics || []);
      }

      if (cvRes.data) {
        setCvData(cvRes.data);
        setSkills(cvRes.data.skills || []);
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
    loadAllData();
  }, [reset, router]);

  // Eğitim Yönetimi
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

  // Deneyim Yönetimi
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

  // Yetenek Yönetimi
  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };
  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  // Mentor Konuları Yönetimi
  const addMentorTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = mentorTopicInput.trim();
    if (trimmed && !mentorTopics.includes(trimmed)) {
      setMentorTopics([...mentorTopics, trimmed]);
      setMentorTopicInput("");
    }
  };
  const removeMentorTopic = (topic: string) => setMentorTopics(mentorTopics.filter((t) => t !== topic));

  // Sertifika Yönetimi
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

  // Dil Yönetimi
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

  // Proje Yönetimi
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

  // Referans Yönetimi
  const addReference = () => {
    setReferences([...references, { name: "", position: "", company: "", email: "", phone: "" }]);
  };
  const updateReference = (index: number, field: string, value: string) => {
    const newRefs = [...references];
    newRefs[index] = { ...newRefs[index], [field]: value } as CvReference;
    setReferences(newRefs);
  };
  const removeReference = (index: number) => setReferences(references.filter((_, i) => i !== index));

  // Özel Bölüm Yönetimi
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

  const onSubmit = async (data: ProfileUpdateInput) => {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();

    // 1. Profiles tablosunu güncelle
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        headline: data.headline || null,
        bio: data.bio || null,
        phone: data.phone || null,
        department: data.department || null,
        location: data.location || null,
        linkedin_url: data.linkedinUrl || null,
        github_url: data.githubUrl || null,
        website_url: data.websiteUrl || null,
        personal_email: data.personalEmail || null,
        is_cv_public: data.isCvPublic ?? false,
        is_open_to_work: data.isOpenToWork ?? false,
        meeting_url: data.meetingUrl || null,
        is_mentor: data.isMentor ?? false,
        mentor_topics: mentorTopics,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (profileError) {
      toast.error("Profil bilgileri güncellenirken hata oluştu");
      setSaving(false);
      return;
    }

    // 2. cv_data tablosunu güncelle (upsert)
    const cvPayload = {
      user_id: profile.id,
      skills,
      education,
      experience,
      certifications,
      languages,
      projects,
      references,
      custom_sections: customSections,
      updated_at: new Date().toISOString(),
    };

    let cvError;
    if (cvData) {
      const { error } = await supabase.from("cv_data").update(cvPayload).eq("id", cvData.id);
      cvError = error;
    } else {
      const { error } = await supabase.from("cv_data").insert(cvPayload);
      cvError = error;
    }

    if (cvError) {
      toast.error("CV verileri kaydedilirken hata oluştu");
      setSaving(false);
      return;
    }

    toast.success("Profil ve Özgeçmiş bilgileriniz başarıyla kaydedildi!");
    router.push("/profile");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Link>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-lg">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">{isEn ? "User Profile & CV Edit" : "Kullanıcı Bilgileri & CV Düzenleme"}</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">{isEn ? "Manage your personal and resume details in one place." : "Kişisel bilgilerinizi ve özgeçmiş bilgilerinizi tek bir yerden yönetin."}</p>
          </div>
          <div>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? t("common.loading") : t("profile.saveChanges")}
            </button>
          </div>
        </div>

        {/* Tab Menüsü */}
        <div className="mb-8 flex gap-2 border-b border-[var(--color-border)] pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "personal"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <User className="h-4 w-4" /> {t("profile.personalInfo")}
          </button>
          <button
            onClick={() => setActiveTab("edu-exp")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "edu-exp"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <GraduationCap className="h-4 w-4" /> {t("profile.eduExp")}
          </button>
          <button
            onClick={() => setActiveTab("skills-more")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "skills-more"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <Award className="h-4 w-4" /> {t("profile.skillsMore")}
          </button>
          <button
            onClick={() => setActiveTab("extra")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "extra"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <FolderGit2 className="h-4 w-4" /> {isEn ? "Projects & References" : "Projeler & Referanslar"}
          </button>
          <button
            onClick={() => setActiveTab("mentorship")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "mentorship"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <Globe className="h-4 w-4" /> {isEn ? "Mentorship" : "Mentörlük"}
          </button>
        </div>

        {/* Form İçeriği */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* TAB 1: KİŞİSEL BİLGİLER */}
          {activeTab === "personal" && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t("auth.firstName")} *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                    <input {...register("firstName")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
                  </div>
                  {errors.firstName && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t("auth.lastName")} *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                    <input {...register("lastName")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
                  </div>
                  {errors.lastName && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">{isEn ? "Professional Headline (shown on your CV)" : "Profesyonel Unvan / Başlık (CV'nizde görünür)"}</label>
                <div className="relative">
                  <HeadlineIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input {...register("headline")} maxLength={120} placeholder={isEn ? "e.g. Frontend Developer Candidate" : "Örn: Frontend Developer Adayı"} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
                </div>
                {errors.headline && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.headline.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">{t("profile.bioTitle")}</label>
                <textarea {...register("bio")} rows={4} maxLength={1000} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" placeholder={t("profile.bioPlaceholder")} />
                {errors.bio && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.bio.message}</p>}
              </div>

              {/* Fakülte & Bölüm Seçimi (İki Aşamalı) */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {isEn ? "Faculty" : "Fakülte"}
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                    <select
                      value={selectedFaculty}
                      onChange={(e) => {
                        setSelectedFaculty(e.target.value);
                        setValue("department", ""); // fakülte değiştiğinde bölümü sıfırla
                      }}
                      className="w-full appearance-none rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                    >
                      <option value="">{isEn ? "Select Faculty" : "Fakülte Seçiniz"}</option>
                      {DEU_FACULTIES.map((fac) => (
                        <option key={fac.name} value={fac.name}>
                          {isEn ? fac.nameEn : fac.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {t("auth.department")} *
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                    <select
                      {...register("department")}
                      disabled={!selectedFaculty}
                      className="w-full appearance-none rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20 disabled:opacity-50"
                    >
                      <option value="">{isEn ? "Select Department" : "Bölüm Seçiniz"}</option>
                      {selectedFaculty &&
                        DEU_FACULTIES.find((fac) => fac.name === selectedFaculty)
                          ?.departments.map((dept) => (
                            <option key={dept.name} value={dept.name}>
                              {isEn ? dept.nameEn : dept.name}
                            </option>
                          ))}
                    </select>
                  </div>
                  {errors.department && (
                    <p className="mt-1 text-xs text-[var(--color-error)]">
                      {errors.department.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t("auth.phone")}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                    <input {...register("phone")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" placeholder="+905554443322" />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{isEn ? "Personal Contact Email" : "Kişisel İletişim E-Postası"}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                    <input {...register("personalEmail")} type="email" className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" placeholder="ornek@mail.com" />
                  </div>
                  {errors.personalEmail && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.personalEmail.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">{isEn ? "Location (City, Country)" : "Konum (Şehir, Ülke)"}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input {...register("location")} placeholder={isEn ? "e.g. Izmir, Turkey" : "Örn: İzmir, Türkiye"} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
                </div>
                {errors.location && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.location.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">LinkedIn URL</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                    <input {...register("linkedinUrl")} placeholder="https://linkedin.com/in/..." className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
                  </div>
                  {errors.linkedinUrl && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.linkedinUrl.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">GitHub URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                    <input {...register("githubUrl")} placeholder="https://github.com/..." className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
                  </div>
                  {errors.githubUrl && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.githubUrl.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">{t("profile.personalWebsite")}</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input {...register("websiteUrl")} placeholder="https://..." className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
                </div>
                {errors.websiteUrl && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.websiteUrl.message}</p>}
              </div>

              {/* İş Arıyorum Durumu */}
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/50 p-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">{isEn ? "Open to Work" : "Aktif Olarak İş / Staj Arıyorum"}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{isEn ? "Employers can filter for candidates who are actively looking in the Talent Hub." : "İşverenler Yetenek Havuzu'nda aktif olarak iş arayan adayları filtreleyebilir."}</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" {...register("isOpenToWork")} className="peer sr-only" />
                  <div className="h-6 w-11 rounded-full bg-[var(--color-border)] transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-full" />
                </label>
              </div>

              {/* CV Görünürlük Kontrolü */}
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/50 p-4">
                <div className="flex items-center gap-3">
                  {profile?.is_cv_public ? <Eye className="h-5 w-5 text-emerald-500" /> : <EyeOff className="h-5 w-5 text-[var(--color-muted-foreground)]" />}
                  <div>
                    <p className="text-sm font-medium">{t("cv.toggleVisibility")}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{isEn ? "Allows your resume to be searchable and viewable by everyone." : "Özgeçmişinizin herkes tarafından aranabilir ve görüntülenebilir olmasını sağlar."}</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" {...register("isCvPublic")} className="peer sr-only" />
                  <div className="h-6 w-11 rounded-full bg-[var(--color-border)] transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[var(--color-primary)] peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: EĞİTİM & DENEYİM */}
          {activeTab === "edu-exp" && (
            <div className="space-y-6 animate-fade-in">
              {/* EĞİTİM BÖLÜMÜ */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                    <GraduationCap className="h-5 w-5 text-emerald-500" />
                    {isEn ? "Education Information" : "Eğitim Bilgileri"}
                  </h2>
                  <button type="button" onClick={addEducation} className="text-xs flex items-center gap-1 text-[var(--color-primary)] hover:underline font-semibold bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-lg">
                    <Plus className="h-3 w-3" /> {t("profile.addEdu")}
                  </button>
                </div>

                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-card)] shadow-sm">
                      <button type="button" onClick={() => removeEducation(index)} className="absolute top-3 right-3 text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "School / University *" : "Okul / Üniversite *"}</label>
                          <input required value={edu.school} onChange={e => updateEducation(index, 'school', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Dokuz Eylül Üniversitesi" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Degree" : "Derece"}</label>
                          <input value={edu.degree || ""} onChange={e => updateEducation(index, 'degree', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder={isEn ? "Bachelor's Degree" : "Lisans"} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Department / Program *" : "Bölüm / Program *"}</label>
                          <input required value={edu.field || ""} onChange={e => updateEducation(index, 'field', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Yönetim Bilişim Sistemleri" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Location" : "Konum"}</label>
                          <input value={edu.location || ""} onChange={e => updateEducation(index, 'location', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="İzmir, Türkiye" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{t("profile.startYear")} *</label>
                          <input required value={edu.startDate} onChange={e => updateEducation(index, 'startDate', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="2022" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{t("profile.endYear")}</label>
                          <input disabled={edu.current} value={edu.endDate || ""} onChange={e => updateEducation(index, 'endDate', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-50" placeholder="2026" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted-foreground)]">
                            <input type="checkbox" checked={Boolean(edu.current)} onChange={e => updateEducation(index, 'current', e.target.checked)} />
                            {isEn ? "I currently study here" : "Halen bu okulda okuyorum"}
                          </label>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "GPA (optional)" : "Not Ortalaması (opsiyonel)"}</label>
                          <input value={edu.gpa || ""} onChange={e => updateEducation(index, 'gpa', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="3.45 / 4.00" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Additional details (optional)" : "Ek Bilgi (opsiyonel)"}</label>
                          <textarea rows={2} value={edu.description || ""} onChange={e => updateEducation(index, 'description', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none resize-none" placeholder={isEn ? "Honors, relevant coursework, thesis..." : "Onur belgesi, ilgili dersler, tez konusu..."} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {education.length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6 border border-dashed rounded-xl bg-[var(--color-card)]">{isEn ? "No education history added yet." : "Henüz eğitim geçmişi eklenmedi."}</p>
                  )}
                </div>
              </div>

              {/* DENEYİM BÖLÜMÜ */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                    <Briefcase className="h-5 w-5 text-amber-500" />
                    {isEn ? "Work & Internship Experience" : "İş / Staj Deneyimleri"}
                  </h2>
                  <button type="button" onClick={addExperience} className="text-xs flex items-center gap-1 text-[var(--color-primary)] hover:underline font-semibold bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-lg">
                    <Plus className="h-3 w-3" /> {t("profile.addExp")}
                  </button>
                </div>

                <div className="space-y-4">
                  {experience.map((exp, index) => (
                    <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-card)] shadow-sm">
                      <button type="button" onClick={() => removeExperience(index)} className="absolute top-3 right-3 text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Company / Institution *" : "Şirket / Kurum *"}</label>
                          <input required value={exp.company} onChange={e => updateExperience(index, 'company', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: Trendyol" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Position / Title *" : "Pozisyon / Unvan *"}</label>
                          <input required value={exp.title} onChange={e => updateExperience(index, 'title', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: Yazılım Stajyeri" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Location" : "Konum"}</label>
                          <input value={exp.location || ""} onChange={e => updateExperience(index, 'location', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder={isEn ? "e.g. Istanbul, Turkey (Hybrid)" : "Örn: İstanbul, Türkiye (Hibrit)"} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Start Date *" : "Başlangıç Tarihi *"}</label>
                          <input required value={exp.startDate} onChange={e => updateExperience(index, 'startDate', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Temmuz 2023" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "End Date" : "Bitiş Tarihi"}</label>
                          <input disabled={exp.current} value={exp.endDate || ""} onChange={e => updateExperience(index, 'endDate', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-50" placeholder="Eylül 2023" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted-foreground)]">
                            <input type="checkbox" checked={Boolean(exp.current)} onChange={e => updateExperience(index, 'current', e.target.checked)} />
                            {isEn ? "I currently work here" : "Halen bu pozisyonda çalışıyorum"}
                          </label>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Job Description / Explanation" : "Görev Tanımı / Açıklama"}</label>
                          <textarea rows={3} value={exp.description || ""} onChange={e => updateExperience(index, 'description', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none resize-none" placeholder={isEn ? "Your projects, achievements and technologies (one bullet per line)..." : "Projeleriniz, başarılarınız ve kullandığınız teknolojiler (her satır bir madde olur)..."} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {experience.length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6 border border-dashed rounded-xl bg-[var(--color-card)]">{isEn ? "No work or internship experience added yet." : "Henüz iş veya staj deneyimi eklenmedi."}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: YETENEK, DİL & SERTİFİKALAR */}
          {activeTab === "skills-more" && (
            <div className="space-y-6 animate-fade-in">
              {/* YETENEKLER BÖLÜMÜ */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-5">
                <h2 className="mb-3 flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                  <Award className="h-5 w-5 text-indigo-500" />
                  {t("profile.skills")}
                </h2>
                <div className="flex gap-2">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { addSkill(e); } }}
                    className="flex-1 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-[var(--color-ring)] focus:outline-none"
                    placeholder={isEn ? "Type a skill and press Enter or click plus..." : "Yetenek yazıp Enter'a veya artıya basın..."}
                  />
                  <button type="button" onClick={addSkill} className="rounded-xl bg-[var(--color-primary)] px-4 text-white hover:opacity-90">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {skills.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span key={skill} className="flex items-center gap-1 rounded-xl bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500"><Plus className="h-3 w-3 rotate-45" /></button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">{isEn ? "No skills added yet (e.g. React, Python, Project Management)." : "Henüz yetenek eklenmedi (Örn: React, Python, Project Management, SQL)."}</p>
                )}
              </div>

              {/* DİLLER BÖLÜMÜ */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                    <Languages className="h-5 w-5 text-purple-500" />
                    {t("cv.languages")}
                  </h2>
                  <button type="button" onClick={addLanguage} className="text-xs flex items-center gap-1 text-[var(--color-primary)] hover:underline font-semibold bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-lg">
                    <Plus className="h-3 w-3" /> {t("profile.addLanguage")}
                  </button>
                </div>

                <div className="space-y-3">
                  {languages.map((lang, index) => (
                    <div key={index} className="flex items-center gap-3 bg-[var(--color-card)] p-3 rounded-xl border border-[var(--color-border)]">
                      <input required value={lang.language} onChange={e => updateLanguage(index, 'language', e.target.value)} className="flex-1 min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" placeholder={isEn ? "Language (e.g. English)" : "Dil adı (Örn: İngilizce)"} />
                      <select value={lang.level} onChange={e => updateLanguage(index, 'level', e.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none">
                        {languageLevels.map((lvl) => (
                          <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => removeLanguage(index)} className="text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors p-1">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                  {languages.length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6 border border-dashed rounded-xl bg-[var(--color-card)]">{isEn ? "No language information added yet." : "Henüz dil bilgisi eklenmedi."}</p>
                  )}
                </div>
              </div>

              {/* SERTİFİKALAR BÖLÜMÜ */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                    <CertificateIcon className="h-5 w-5 text-rose-500" />
                    {isEn ? "Certificates & Licenses" : "Sertifikalar & Lisanslar"}
                  </h2>
                  <button type="button" onClick={addCertification} className="text-xs flex items-center gap-1 text-[var(--color-primary)] hover:underline font-semibold bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-lg">
                    <Plus className="h-3 w-3" /> {t("profile.addCertificate")}
                  </button>
                </div>

                <div className="space-y-4">
                  {certifications.map((cert, index) => (
                    <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-card)] shadow-sm">
                      <button type="button" onClick={() => removeCertification(index)} className="absolute top-3 right-3 text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Certificate Name *" : "Sertifika Adı *"}</label>
                          <input required value={cert.name} onChange={e => updateCertification(index, 'name', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: AWS Certified Cloud Practitioner" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Issuing Organization *" : "Veren Kurum *"}</label>
                          <input required value={cert.issuer} onChange={e => updateCertification(index, 'issuer', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: Amazon Web Services" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Issue Date" : "Alındığı Tarih"}</label>
                          <input value={cert.date || ""} onChange={e => updateCertification(index, 'date', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Örn: 2023" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Verification Link (optional)" : "Doğrulama Bağlantısı (opsiyonel)"}</label>
                          <input value={cert.url || ""} onChange={e => updateCertification(index, 'url', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="https://..." />
                        </div>
                      </div>
                    </div>
                  ))}
                  {certifications.length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6 border border-dashed rounded-xl bg-[var(--color-card)]">{isEn ? "No certifications added yet." : "Henüz sertifika eklenmedi."}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROJELER, REFERANSLAR & ÖZEL BÖLÜMLER */}
          {activeTab === "extra" && (
            <div className="space-y-6 animate-fade-in">
              {/* PROJELER BÖLÜMÜ */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                    <FolderGit2 className="h-5 w-5 text-sky-500" />
                    {isEn ? "CV Projects" : "CV Projeleri"}
                  </h2>
                  <button type="button" onClick={addProject} className="text-xs flex items-center gap-1 text-[var(--color-primary)] hover:underline font-semibold bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-lg">
                    <Plus className="h-3 w-3" /> {isEn ? "Add Project" : "Proje Ekle"}
                  </button>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mb-4">
                  {isEn
                    ? "These are shown on your CV independently of your public "
                    : "Bu projeler, "}
                  <Link href="/projects" className="text-[var(--color-primary)] font-semibold hover:underline">{isEn ? "Projects page" : "Projeler sayfanızdaki"}</Link>
                  {isEn ? " portfolio; summarize your most relevant work here." : " gönderilerinizden bağımsız olarak CV'nizde gösterilir; en önemli çalışmalarınızı burada özetleyin."}
                </p>
                <div className="space-y-4">
                  {projects.map((proj, index) => (
                    <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-card)] shadow-sm">
                      <button type="button" onClick={() => removeProject(index)} className="absolute top-3 right-3 text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Project Title *" : "Proje Başlığı *"}</label>
                          <input required value={proj.title} onChange={e => updateProject(index, 'title', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Description" : "Açıklama"}</label>
                          <textarea rows={2} value={proj.description || ""} onChange={e => updateProject(index, 'description', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none resize-none" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Technologies (comma separated)" : "Teknolojiler (virgülle ayırın)"}</label>
                          <input value={(proj.technologies || []).join(", ")} onChange={e => updateProject(index, 'technologies', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="React, Node.js, PostgreSQL" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Date" : "Tarih"}</label>
                          <input value={proj.date || ""} onChange={e => updateProject(index, 'date', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Link (optional)" : "Bağlantı (opsiyonel)"}</label>
                          <input value={proj.url || ""} onChange={e => updateProject(index, 'url', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" placeholder="https://..." />
                        </div>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6 border border-dashed rounded-xl bg-[var(--color-card)]">{isEn ? "No projects added to your CV yet." : "CV'nize henüz proje eklenmedi."}</p>
                  )}
                </div>
              </div>

              {/* REFERANSLAR BÖLÜMÜ */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                    <Users className="h-5 w-5 text-orange-500" />
                    {isEn ? "References" : "Referanslar"}
                  </h2>
                  <button type="button" onClick={addReference} className="text-xs flex items-center gap-1 text-[var(--color-primary)] hover:underline font-semibold bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-lg">
                    <Plus className="h-3 w-3" /> {isEn ? "Add Reference" : "Referans Ekle"}
                  </button>
                </div>
                <div className="space-y-4">
                  {references.map((ref, index) => (
                    <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-card)] shadow-sm">
                      <button type="button" onClick={() => removeReference(index)} className="absolute top-3 right-3 text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Full Name *" : "Ad Soyad *"}</label>
                          <input required value={ref.name} onChange={e => updateReference(index, 'name', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Position" : "Pozisyon"}</label>
                          <input value={ref.position || ""} onChange={e => updateReference(index, 'position', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Company" : "Kurum"}</label>
                          <input value={ref.company || ""} onChange={e => updateReference(index, 'company', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Email" : "E-posta"}</label>
                          <input type="email" value={ref.email || ""} onChange={e => updateReference(index, 'email', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">{isEn ? "Phone" : "Telefon"}</label>
                          <input value={ref.phone || ""} onChange={e => updateReference(index, 'phone', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm mt-1 focus:border-[var(--color-primary)] focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {references.length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6 border border-dashed rounded-xl bg-[var(--color-card)]">{isEn ? "No references added yet." : "Henüz referans eklenmedi."}</p>
                  )}
                </div>
              </div>

              {/* ÖZEL BÖLÜMLER */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                    <FileStack className="h-5 w-5 text-teal-500" />
                    {isEn ? "Custom Sections" : "Özel Bölümler"}
                  </h2>
                  <button type="button" onClick={addCustomSection} className="text-xs flex items-center gap-1 text-[var(--color-primary)] hover:underline font-semibold bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-lg">
                    <Plus className="h-3 w-3" /> {isEn ? "Add Section" : "Bölüm Ekle"}
                  </button>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mb-4">
                  {isEn ? "Add any extra CV section you need (Volunteering, Publications, Awards, Hobbies...)." : "İhtiyacınıza göre (Gönüllülük, Yayınlar, Ödüller, İlgi Alanları vb.) ek CV bölümleri oluşturabilirsiniz."}
                </p>
                <div className="space-y-4">
                  {customSections.map((section, index) => (
                    <div key={index} className="relative rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-card)] shadow-sm">
                      <button type="button" onClick={() => removeCustomSection(index)} className="absolute top-3 right-3 text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                      <div className="space-y-2">
                        <input value={section.title} onChange={e => updateCustomSectionTitle(index, e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-semibold focus:border-[var(--color-primary)] focus:outline-none" placeholder={isEn ? "Section Title (e.g. Volunteering)" : "Bölüm Başlığı (Örn: Gönüllülük Çalışmaları)"} />
                        <textarea rows={3} value={(section.items || []).join("\n")} onChange={e => updateCustomSectionItems(index, e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none resize-none" placeholder={isEn ? "One item per line" : "Her satıra bir madde yazın"} />
                      </div>
                    </div>
                  ))}
                  {customSections.length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6 border border-dashed rounded-xl bg-[var(--color-card)]">{isEn ? "No custom sections added yet." : "Henüz özel bölüm eklenmedi."}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MENTÖRLÜK */}
          {activeTab === "mentorship" && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                      <Globe className="h-5 w-5 text-indigo-500" />
                      {isEn ? "Mentorship Settings" : "Mentörlük Ayarları"}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                      {isEn
                        ? "Offer guidance to other students by enabling your mentor profile."
                        : "Mentörlük profilinizi aktif ederek diğer öğrencilere deneyimlerinizi aktarın."}
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" {...register("isMentor")} />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--color-foreground)] flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                      {isEn ? "Meeting Link (Calendly, etc.)" : "Randevu Linki (Calendly vb.)"}
                    </label>
                    <input
                      type="url"
                      {...register("meetingUrl")}
                      className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="https://calendly.com/your-username"
                    />
                    {errors.meetingUrl && <p className="mt-1 text-xs text-red-500">{errors.meetingUrl.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--color-foreground)] flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                      {isEn ? "Mentorship Topics" : "Mentörlük Konuları"}
                    </label>
                    <div className="flex gap-2 mt-1.5">
                      <input
                        value={mentorTopicInput}
                        onChange={(e) => setMentorTopicInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { addMentorTopic(e); } }}
                        className="flex-1 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none"
                        placeholder={isEn ? "e.g. Career Advice, Interview Prep..." : "Örn: Kariyer Tavsiyesi, Mülakat Hazırlığı..."}
                      />
                      <button type="button" onClick={addMentorTopic} className="rounded-xl bg-indigo-600 px-4 text-white hover:opacity-90 transition-opacity">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {mentorTopics.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {mentorTopics.map((topic) => (
                          <span key={topic} className="flex items-center gap-1 rounded-xl bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {topic}
                            <button type="button" onClick={() => removeMentorTopic(topic)} className="hover:text-red-500 ml-1">
                              <Plus className="h-3 w-3 rotate-45" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                        {isEn ? "Add topics you can help with." : "Hangi konularda destek olabileceğinizi ekleyin."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kaydetme Butonu (Alt Kısım) */}
          <div className="border-t border-[var(--color-border)] pt-5">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl gradient-primary py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              {saving ? t("common.loading") : t("profile.saveChanges")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
