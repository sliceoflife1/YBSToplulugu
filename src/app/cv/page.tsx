"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, Download, Eye, Save, GraduationCap, Briefcase, Award, Languages } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import type { Profile, CvData } from "@/types/database";

export default function CvBuilderPage() {
  const t = useTranslations("cv");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
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
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();

    const payload = {
      user_id: profile.id,
      skills,
      education: cvData?.education || [],
      experience: cvData?.experience || [],
      certifications: cvData?.certifications || [],
      languages: cvData?.languages || [],
      updated_at: new Date().toISOString(),
    };

    if (cvData) {
      await supabase.from("cv_data").update(payload).eq("id", cvData.id);
    } else {
      await supabase.from("cv_data").insert(payload);
    }

    toast.success("CV kaydedildi!");
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
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Editor */}
            <div className="space-y-6">
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

              {/* Education placeholder */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                  <GraduationCap className="h-5 w-5 text-emerald-500" />
                  {t("education")}
                </h2>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Eğitim bilgilerini eklemek için düzenle butonuna tıklayın.
                </p>
              </div>

              {/* Experience placeholder */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                  <Briefcase className="h-5 w-5 text-orange-500" />
                  {t("experience")}
                </h2>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Deneyim bilgilerini eklemek için düzenle butonuna tıklayın.
                </p>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-sm dark:bg-[var(--color-card)]">
              <h2 className="mb-6 flex items-center gap-2 font-semibold text-[var(--color-muted-foreground)]">
                <Eye className="h-4 w-4" /> {t("preview")}
              </h2>

              {/* CV Preview */}
              <div className="space-y-6">
                <div className="border-b border-[var(--color-border)] pb-4">
                  <h3 className="text-xl font-bold text-[var(--color-foreground)]">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{profile?.department}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--color-muted-foreground)]">
                    {profile?.edu_email && <span>{profile.edu_email}</span>}
                    {profile?.phone && <span>• {profile.phone}</span>}
                    {profile?.linkedin_url && <span>• LinkedIn</span>}
                    {profile?.github_url && <span>• GitHub</span>}
                  </div>
                </div>

                {profile?.bio && (
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">Hakkımda</h4>
                    <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{profile.bio}</p>
                  </div>
                )}

                {skills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">Yetenekler</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <span key={skill} className="rounded bg-[var(--color-muted)] px-2 py-0.5 text-xs">{skill}</span>
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
