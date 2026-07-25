'use client';

import type { Profile, CvEducation, CvExperience, CvCertification, CvLanguage, CvProject, CvReference, CvCustomSection } from "@/types/database";

interface CvWebPreviewProps {
  profile: Profile;
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

export default function CvWebPreview({
  profile,
  skills,
  education,
  experience,
  certifications = [],
  languages = [],
  projects = [],
  references = [],
  customSections = [],
  templateName = 'standard',
  primaryColor = '#0ea5e9',
}: CvWebPreviewProps) {

  // --------------------------------------------------
  // 1. STANDART / TOPLULUK ŞABLONU (Varsayılan 2 Kolon)
  // --------------------------------------------------
  if (templateName === 'standard') {
    return (
      <div className="bg-white text-slate-800 rounded-xl border border-[var(--color-border)] shadow-xl overflow-hidden min-h-[842px] flex">
        {/* Sol Kolon (Sidebar) */}
        <div className="w-1/3 bg-[#202d3d] text-white p-6 flex flex-col gap-6">
          {profile.avatar_url && (
            <div className="flex justify-center">
              <img
                src={profile.avatar_url}
                alt={profile.first_name}
                className="w-24 h-24 rounded-full border-2 border-white object-cover shadow-md"
              />
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-bold text-white border-b border-slate-600/80 pb-1 mb-2.5 tracking-wider uppercase">İLETİŞİM</h3>
            <div className="text-xs text-slate-200 space-y-2">
              {profile.location && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">KONUM</span>
                  <span className="text-slate-200">{profile.location}</span>
                </div>
              )}
              {profile.phone && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">TELEFON</span>
                  <span className="text-slate-200">{profile.phone}</span>
                </div>
              )}
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">E-POSTA</span>
                <span className="text-slate-200 break-all">{profile.edu_email}</span>
              </div>
              {profile.website_url && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">WEB</span>
                  <span className="text-slate-200 break-all">{profile.website_url.replace(/https?:\/\/(www\.)?/, '')}</span>
                </div>
              )}
            </div>
          </div>

          {education.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-white border-b border-slate-600 pb-1 mb-2 tracking-wider">EĞİTİM</h3>
              <div className="space-y-3 text-xs">
                {education.map((edu, i) => (
                  <div key={i}>
                    <p className="font-bold text-white">{edu.school}</p>
                    <p className="text-slate-300">{edu.degree} - {edu.field}</p>
                    <p className="text-[10px] text-slate-400">{edu.startDate || (edu as any).start_date} - {edu.current ? 'Devam Ediyor' : (edu.endDate || (edu as any).end_date)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-white border-b border-slate-600 pb-1 mb-2 tracking-wider">YETENEKLER</h3>
              <div className="flex flex-wrap gap-1">
                {skills.map((skill, i) => (
                  <span key={i} className="text-[11px] bg-slate-700/60 text-slate-200 px-2 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-white border-b border-slate-600 pb-1 mb-2 tracking-wider">DİLLER</h3>
              <div className="text-xs text-slate-300 space-y-1">
                {languages.map((l, i) => (
                  <p key={i}>• {l.language || (l as any).name} ({l.level})</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ Kolon (Main) */}
        <div className="w-2/3 p-8 flex flex-col gap-6">
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">{profile.first_name} {profile.last_name}</h1>
            {profile.headline && <p className="text-sm font-semibold mt-1" style={{ color: primaryColor }}>{profile.headline}</p>}
          </div>

          {profile.bio && (
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">HAKKIMDA</h2>
              <p className="text-xs text-slate-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {experience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">İŞ VE STAJ DENEYİMİ</h2>
              <div className="space-y-4">
                {experience.map((exp, i) => (
                  <div key={i} className="border-l-2 border-slate-300 pl-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xs font-bold text-slate-800">{exp.title || (exp as any).position} — {exp.company}</h3>
                      <span className="text-[10px] text-slate-500">{exp.startDate || (exp as any).start_date} - {exp.current ? 'Devam Ediyor' : (exp.endDate || (exp as any).end_date)}</span>
                    </div>
                    {exp.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PROJELER</h2>
              <div className="space-y-2 text-xs">
                {projects.map((p, i) => (
                  <div key={i} className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <p className="font-bold text-slate-800">{p.title}</p>
                    {p.description && <p className="text-slate-600 text-[11px] mt-0.5">{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // 2. KURUMSAL / KLASİK ŞABLON (Tek Kolon Çizgili)
  // --------------------------------------------------
  if (templateName === 'corporate') {
    return (
      <div className="bg-white text-slate-800 rounded-xl border border-[var(--color-border)] shadow-xl p-8 min-h-[842px] space-y-6">
        {/* Üst Header */}
        <div className="border-b-2 pb-4 flex justify-between items-end" style={{ borderColor: primaryColor }}>
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ color: primaryColor }}>
              {profile.first_name} {profile.last_name}
            </h1>
            {profile.headline && <p className="text-sm font-medium text-slate-600 mt-1">{profile.headline}</p>}
          </div>
          <div className="text-right text-xs text-slate-600 space-y-0.5">
            <p>{profile.edu_email}</p>
            {profile.phone && <p>{profile.phone}</p>}
            {profile.location && <p>{profile.location}</p>}
          </div>
        </div>

        {profile.bio && (
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: primaryColor }}>ÖZET</h2>
            <p className="text-xs text-slate-700 leading-relaxed border-l-2 pl-3" style={{ borderColor: primaryColor }}>
              {profile.bio}
            </p>
          </div>
        )}

        {experience.length > 0 && (
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-3 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
              DENEYİM VE KARİYER GEÇMİŞİ
            </h2>
            <div className="space-y-4">
              {experience.map((exp, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xs font-bold text-slate-900">{exp.title || (exp as any).position} — <span className="text-slate-700">{exp.company}</span></h3>
                    <span className="text-[11px] text-slate-500">{exp.startDate || (exp as any).start_date} - {exp.current ? 'Devam Ediyor' : (exp.endDate || (exp as any).end_date)}</span>
                  </div>
                  {exp.description && <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 pt-2">
          {education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold tracking-widest uppercase mb-2 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
                EĞİTİM BİLGİLERİ
              </h2>
              <div className="space-y-2 text-xs">
                {education.map((edu, i) => (
                  <div key={i}>
                    <p className="font-bold text-slate-900">{edu.school}</p>
                    <p className="text-slate-600">{edu.degree} - {edu.field}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold tracking-widest uppercase mb-2 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
                UZMANLIK ALANLARI
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // 3. MODERN / YARATICI ŞABLON (Renkli Kartlı Düzen)
  // --------------------------------------------------
  if (templateName === 'modern') {
    return (
      <div className="bg-slate-50 text-slate-800 rounded-xl border border-[var(--color-border)] shadow-xl overflow-hidden min-h-[842px] p-6 space-y-6">
        {/* Üst Bilgi Kartı */}
        <div className="rounded-2xl p-6 text-white shadow-lg flex justify-between items-center" style={{ backgroundColor: primaryColor }}>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{profile.first_name} {profile.last_name}</h1>
            {profile.headline && <p className="text-xs font-medium text-white/90 mt-1">{profile.headline}</p>}
          </div>
          <div className="text-right text-xs text-white/80 space-y-0.5">
            <p>{profile.edu_email}</p>
            {profile.phone && <p>{profile.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sol Dar Kolon */}
          <div className="col-span-4 space-y-4">
            {skills.length > 0 && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">YETENEKLER</h2>
                <div className="flex flex-wrap gap-1">
                  {skills.map((s, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 text-xs">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">DİLLER</h2>
                {languages.map((l, i) => (
                  <p key={i} className="text-slate-600">• {l.language || (l as any).name} ({l.level})</p>
                ))}
              </div>
            )}
          </div>

          {/* Sağ Geniş Kolon */}
          <div className="col-span-8 space-y-4">
            {experience.length > 0 && (
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/60">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">DENEYİM</h2>
                <div className="space-y-3">
                  {experience.map((exp, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xs font-bold text-slate-900">{exp.title || (exp as any).position} @ {exp.company}</h3>
                        <span className="text-[10px] text-slate-500">{exp.startDate || (exp as any).start_date} - {exp.current ? 'Devam' : (exp.endDate || (exp as any).end_date)}</span>
                      </div>
                      {exp.description && <p className="text-xs text-slate-600 mt-1">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // 4. AKADEMİK / ATS SADE ŞABLON (Siyah-Beyaz Minimal)
  // --------------------------------------------------
  return (
    <div className="bg-white text-black font-serif rounded-xl border border-[var(--color-border)] shadow-xl p-8 min-h-[842px] space-y-5">
      <div className="text-center border-b border-black pb-3">
        <h1 className="text-2xl font-bold uppercase tracking-wider">{profile.first_name} {profile.last_name}</h1>
        {profile.headline && <p className="text-xs italic text-slate-700 mt-1">{profile.headline}</p>}
        <p className="text-[11px] text-slate-800 mt-1">
          {profile.edu_email} {profile.phone && `• ${profile.phone}`} {profile.location && `• ${profile.location}`}
        </p>
      </div>

      {profile.bio && (
        <div>
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1.5">ÖZET</h2>
          <p className="text-xs leading-relaxed text-slate-900">{profile.bio}</p>
        </div>
      )}

      {education.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-2">EĞİTİM BİLGİLERİ</h2>
          <div className="space-y-2 text-xs">
            {education.map((edu, i) => (
              <div key={i} className="flex justify-between">
                <div>
                  <p className="font-bold">{edu.school}</p>
                  <p className="italic text-slate-700">{edu.degree} - {edu.field}</p>
                </div>
                <span className="text-slate-700">{edu.startDate || (edu as any).start_date} - {edu.current ? 'Devam' : (edu.endDate || (edu as any).end_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {experience.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-2">DENEYİM VE AKADEMİK GÖREVLER</h2>
          <div className="space-y-3 text-xs">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between font-bold">
                  <span>{exp.title || (exp as any).position} — {exp.company}</span>
                  <span className="font-normal text-slate-700">{exp.startDate || (exp as any).start_date} - {exp.current ? 'Devam' : (exp.endDate || (exp as any).end_date)}</span>
                </div>
                {exp.description && <p className="text-[11px] text-slate-800 mt-0.5 leading-relaxed">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
