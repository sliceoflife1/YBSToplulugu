'use client';

import type { Profile, CvEducation, CvExperience, CvCertification, CvLanguage, CvProject, CvReference, CvCustomSection } from "@/types/database";
import { formatDateRange } from "@/lib/cv/normalize";

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

function formatUrlLabel(url?: string | null) {
  if (!url) return "";
  return url.replace(/https?:\/\/(www\.)?/, "");
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
        <div className="w-1/3 bg-[#202d3d] text-white p-6 flex flex-col gap-6 shrink-0">
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
                  <span className="text-slate-200 break-all">{formatUrlLabel(profile.website_url)}</span>
                </div>
              )}
              {profile.linkedin_url && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">LINKEDIN</span>
                  <span className="text-slate-200 break-all">{formatUrlLabel(profile.linkedin_url)}</span>
                </div>
              )}
              {profile.github_url && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">GITHUB</span>
                  <span className="text-slate-200 break-all">{formatUrlLabel(profile.github_url)}</span>
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
                    {edu.gpa && <p className="text-[10px] text-slate-400">Ortalama: {edu.gpa}</p>}
                    <p className="text-[10px] text-slate-400">{formatDateRange(edu.startDate || (edu as any).start_date, edu.endDate || (edu as any).end_date, edu.current)}</p>
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
                      <span className="text-[10px] text-slate-500">{formatDateRange(exp.startDate || (exp as any).start_date, exp.endDate || (exp as any).end_date, exp.current)}</span>
                    </div>
                    {exp.location && <p className="text-[11px] text-slate-500">{exp.location}</p>}
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

          {certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SERTİFİKALAR</h2>
              <div className="space-y-1.5 text-xs text-slate-700">
                {certifications.map((cert, i) => (
                  <div key={i} className="flex justify-between items-baseline">
                    <span>• <strong className="text-slate-800">{cert.name}</strong> — {cert.issuer}</span>
                    <span className="text-[10px] text-slate-500">{cert.date || (cert as any).issue_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {references.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">REFERANSLAR</h2>
              <div className="space-y-1.5 text-xs text-slate-700">
                {references.map((ref, i) => (
                  <p key={i}>• <strong className="text-slate-800">{ref.name}</strong> — {ref.position || (ref as any).title}{ref.company ? `, ${ref.company}` : ''} ({(ref as any).contact || [ref.email, ref.phone].filter(Boolean).join(" • ")})</p>
                ))}
              </div>
            </div>
          )}

          {customSections.filter(s => s.title && s.items?.length > 0).map((section, i) => (
            <div key={i}>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{section.title}</h2>
              <div className="space-y-1 text-xs text-slate-700">
                {section.items.map((item, ii) => (
                  <p key={ii}>• {item}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // 2. KURUMSAL / KLASİK ŞABLON (Tek Kolon Çizgili)
  // --------------------------------------------------
  if (templateName === 'corporate') {
    const contactParts = [
      profile.edu_email,
      profile.phone,
      profile.location,
      profile.website_url ? formatUrlLabel(profile.website_url) : null,
      profile.linkedin_url ? formatUrlLabel(profile.linkedin_url) : null,
      profile.github_url ? formatUrlLabel(profile.github_url) : null,
    ].filter(Boolean) as string[];

    return (
      <div className="bg-white text-slate-800 rounded-xl border border-[var(--color-border)] shadow-xl p-8 min-h-[842px] space-y-6">
        {/* Üst Header */}
        <div className="border-b-2 pb-4 flex justify-between items-center gap-4" style={{ borderColor: primaryColor }}>
          <div className="flex-1">
            <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ color: primaryColor }}>
              {profile.first_name} {profile.last_name}
            </h1>
            {profile.headline && <p className="text-sm font-semibold text-slate-600 mt-1">{profile.headline}</p>}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-slate-600">
              {contactParts.map((part, i) => (
                <span key={i}>{i > 0 && <span className="mr-3 text-slate-400">•</span>}{part}</span>
              ))}
            </div>
          </div>
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt={`${profile.first_name} ${profile.last_name}`}
              className="w-16 h-16 rounded-full object-cover border-2 shadow-sm shrink-0"
              style={{ borderColor: primaryColor }}
            />
          )}
        </div>

        {profile.bio && (
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-1.5 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
              PROFESYONEL ÖZET
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-3 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
              İŞ VE STAJ DENEYİMİ
            </h2>
            <div className="space-y-4">
              {experience.map((exp, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xs font-bold text-slate-900">{exp.title || (exp as any).position} — <span className="text-slate-700">{exp.company}</span></h3>
                    <span className="text-[11px] text-slate-500">{formatDateRange(exp.startDate || (exp as any).start_date, exp.endDate || (exp as any).end_date, exp.current)}</span>
                  </div>
                  {exp.location && <p className="text-[11px] text-slate-500">{exp.location}</p>}
                  {exp.description && <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-2 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
              EĞİTİM GEÇMİŞİ
            </h2>
            <div className="space-y-3 text-xs">
              {education.map((edu, i) => (
                <div key={i} className="flex justify-between items-baseline">
                  <div>
                    <p className="font-bold text-slate-900">{edu.school}</p>
                    <p className="text-slate-600">{[edu.degree, edu.field].filter(Boolean).join(' - ')}{edu.gpa ? ` • Not Ortalaması: ${edu.gpa}` : ''}</p>
                  </div>
                  <span className="text-[11px] text-slate-500">{formatDateRange(edu.startDate || (edu as any).start_date, edu.endDate || (edu as any).end_date, edu.current)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-2 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
              PROJELER VE BAŞARILAR
            </h2>
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

        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-2 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
              UZMANLIK VE YETENEKLER
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

        {certifications.length > 0 && (
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-2 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
              SERTİFİKALAR
            </h2>
            <div className="space-y-1.5 text-xs text-slate-700">
              {certifications.map((cert, i) => (
                <div key={i} className="flex justify-between items-baseline">
                  <span>• <strong className="text-slate-800">{cert.name}</strong> — {cert.issuer}</span>
                  <span className="text-[10px] text-slate-500">{cert.date || (cert as any).issue_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-2 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
              YABANCI DİLLER
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {languages.map((l, i) => (
                <span key={i} className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {l.language || (l as any).name} · <strong className="text-slate-900">{l.level}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {references.length > 0 && (
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-2 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
              REFERANSLAR
            </h2>
            <div className="space-y-1.5 text-xs text-slate-700">
              {references.map((ref, i) => (
                <p key={i}>• <strong className="text-slate-800">{ref.name}</strong> — {ref.position || (ref as any).title}{ref.company ? `, ${ref.company}` : ''} ({(ref as any).contact || [ref.email, ref.phone].filter(Boolean).join(" • ")})</p>
              ))}
            </div>
          </div>
        )}

        {customSections.filter(s => s.title && s.items?.length > 0).map((section, i) => (
          <div key={i}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-2 pb-1 border-b border-slate-200" style={{ color: primaryColor }}>
              {section.title}
            </h2>
            <div className="space-y-1 text-xs text-slate-700">
              {section.items.map((item, ii) => (
                <p key={ii}>• {item}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // --------------------------------------------------
  // 3. MODERN / MİNİMALİST ŞABLON (2 Kolon, Renkli Kartlar)
  // --------------------------------------------------
  if (templateName === 'modern') {
    return (
      <div className="bg-white text-slate-800 rounded-xl border border-[var(--color-border)] shadow-xl overflow-hidden min-h-[842px] flex">
        {/* Sol Sabit Yan Çubuk */}
        <div className="w-[34%] bg-[#0b1329] text-white p-6 flex flex-col gap-5 shrink-0">
          {profile.avatar_url && (
            <div className="flex justify-center mb-1">
              <img
                src={profile.avatar_url}
                alt={`${profile.first_name} ${profile.last_name}`}
                className="w-20 h-20 rounded-full object-cover border-2 shadow-md"
                style={{ borderColor: primaryColor }}
              />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight text-white">{profile.first_name} {profile.last_name}</h1>
            {profile.headline && <p className="text-xs font-bold mt-1" style={{ color: primaryColor }}>{profile.headline}</p>}
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-slate-100 border-b border-slate-800 pb-1 mb-2.5 tracking-wider uppercase">İLETİŞİM</h3>
            <div className="text-xs text-slate-300 space-y-2">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">E-POSTA</span>
                <span className="text-slate-200 break-all">{profile.edu_email}</span>
              </div>
              {profile.phone && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">TELEFON</span>
                  <span className="text-slate-200">{profile.phone}</span>
                </div>
              )}
              {profile.location && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">KONUM</span>
                  <span className="text-slate-200">{profile.location}</span>
                </div>
              )}
              {profile.website_url && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">WEB</span>
                  <span className="text-slate-200 break-all">{formatUrlLabel(profile.website_url)}</span>
                </div>
              )}
              {profile.linkedin_url && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">LINKEDIN</span>
                  <span className="text-slate-200 break-all">{formatUrlLabel(profile.linkedin_url)}</span>
                </div>
              )}
              {profile.github_url && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">GITHUB</span>
                  <span className="text-slate-200 break-all">{formatUrlLabel(profile.github_url)}</span>
                </div>
              )}
            </div>
          </div>

          {skills.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-100 border-b border-slate-800 pb-1 mb-2 tracking-wider uppercase">YETENEKLER</h3>
              <div className="space-y-1 text-xs text-slate-300">
                {skills.map((s, i) => (
                  <p key={i}>• {s}</p>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-100 border-b border-slate-800 pb-1 mb-2 tracking-wider uppercase">DİLLER</h3>
              <div className="space-y-1 text-xs text-slate-300">
                {languages.map((l, i) => (
                  <p key={i}>• {l.language || (l as any).name} ({l.level})</p>
                ))}
              </div>
            </div>
          )}

          {references.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-100 border-b border-slate-800 pb-1 mb-2 tracking-wider uppercase">REFERANSLAR</h3>
              <div className="space-y-2 text-xs text-slate-300">
                {references.map((ref, i) => (
                  <div key={i}>
                    <p className="font-bold text-white">{ref.name}</p>
                    <p className="text-[11px] text-slate-400">{[ref.position || (ref as any).title, ref.company].filter(Boolean).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ Ana İçerik */}
        <div className="w-[66%] p-7 space-y-5">
          {profile.bio && (
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">ÖZET</h2>
              <p className="text-xs text-slate-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {experience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">DENEYİMLER</h2>
              <div className="space-y-2.5">
                {experience.map((exp, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                    <div className="flex justify-between items-start">
                      <h3 className="text-xs font-bold text-slate-900">{exp.title || (exp as any).position} @ {exp.company}</h3>
                      <span className="text-[10px] text-slate-500">{formatDateRange(exp.startDate || (exp as any).start_date, exp.endDate || (exp as any).end_date, exp.current)}</span>
                    </div>
                    {exp.location && <p className="text-[10px] text-slate-500">{exp.location}</p>}
                    {exp.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">EĞİTİM</h2>
              <div className="space-y-2">
                {education.map((edu, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                    <div className="flex justify-between items-baseline">
                      <p className="font-bold text-xs text-slate-900">{edu.school}</p>
                      <span className="text-[10px] text-slate-500">{formatDateRange(edu.startDate || (edu as any).start_date, edu.endDate || (edu as any).end_date, edu.current)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{[edu.degree, edu.field].filter(Boolean).join(' - ')}{edu.gpa ? ` • Not Ortalaması: ${edu.gpa}` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">PROJELER</h2>
              <div className="space-y-2">
                {projects.map((p, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                    <p className="font-bold text-xs text-slate-900">{p.title}</p>
                    {p.description && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">SERTİFİKALAR</h2>
              <div className="space-y-1.5 text-xs text-slate-700">
                {certifications.map((cert, i) => (
                  <div key={i} className="flex justify-between items-baseline">
                    <span>• <strong className="text-slate-800">{cert.name}</strong> — {cert.issuer}</span>
                    <span className="text-[10px] text-slate-500">{cert.date || (cert as any).issue_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customSections.filter(s => s.title && s.items?.length > 0).map((section, i) => (
            <div key={i}>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">{section.title}</h2>
              <div className="space-y-1 text-xs text-slate-700">
                {section.items.map((item, ii) => (
                  <p key={ii}>• {item}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // 4. AKADEMİK / ATS SADE ŞABLON (Siyah-Beyaz Minimal)
  // --------------------------------------------------
  const contactParts = [
    profile.edu_email,
    profile.phone,
    profile.location,
    profile.website_url ? formatUrlLabel(profile.website_url) : null,
    profile.linkedin_url ? formatUrlLabel(profile.linkedin_url) : null,
    profile.github_url ? formatUrlLabel(profile.github_url) : null,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-white text-black font-serif rounded-xl border border-[var(--color-border)] shadow-xl p-8 min-h-[842px] space-y-5">
      <div className="border-b border-black pb-3 flex items-center justify-center gap-4">
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt={`${profile.first_name} ${profile.last_name}`}
            className="w-14 h-14 rounded object-cover border border-black shrink-0"
          />
        )}
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold uppercase tracking-wider">{profile.first_name} {profile.last_name}</h1>
          {profile.headline && <p className="text-xs font-bold text-slate-800 mt-1">{profile.headline}</p>}
          <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1 text-[11px] text-slate-800 mt-1">
            {contactParts.map((part, i) => (
              <span key={i}>{i > 0 && <span className="mr-2.5 text-slate-500">|</span>}{part}</span>
            ))}
          </div>
        </div>
      </div>

      {profile.bio && (
        <div>
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1.5">AKADEMİK & PROFESYONEL ÖZET</h2>
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
                  <p className="text-slate-700">{[edu.degree, edu.field].filter(Boolean).join(' - ')}{edu.gpa ? ` • Not Ortalaması: ${edu.gpa}` : ''}</p>
                </div>
                <span className="text-slate-700">{formatDateRange(edu.startDate || (edu as any).start_date, edu.endDate || (edu as any).end_date, edu.current)}</span>
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
                  <span className="font-normal text-slate-700">{formatDateRange(exp.startDate || (exp as any).start_date, exp.endDate || (exp as any).end_date, exp.current)}</span>
                </div>
                {exp.location && <p className="text-[11px] text-slate-600">{exp.location}</p>}
                {exp.description && <p className="text-[11px] text-slate-800 mt-0.5 leading-relaxed">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-2">PROJELER VE YAYINLAR</h2>
          <div className="space-y-2 text-xs">
            {projects.map((p, i) => (
              <div key={i}>
                <p className="font-bold">{p.title}</p>
                {p.description && <p className="text-slate-800 text-[11px] mt-0.5">{p.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-2">TEKNİK YETKİNLİKLER</h2>
          <p className="text-xs text-slate-900">{skills.join(', ')}</p>
        </div>
      )}

      {languages.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-2">YABANCI DİLLER</h2>
          <p className="text-xs text-slate-900">
            {languages.map((l) => `${l.language || (l as any).name} (${l.level})`).join('  •  ')}
          </p>
        </div>
      )}

      {certifications.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-2">SERTİFİKALAR VE EĞİTİMLER</h2>
          <div className="space-y-1.5 text-xs">
            {certifications.map((cert, i) => (
              <div key={i} className="flex justify-between items-baseline">
                <span>{cert.name} — {cert.issuer}</span>
                <span className="text-slate-600">{cert.date || (cert as any).issue_date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {references.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-2">AKADEMİK / SEKTÖREL REFERANSLAR</h2>
          <div className="space-y-1 text-xs">
            {references.map((r, i) => (
              <p key={i}>• {r.name} — {r.position || (r as any).title}, {r.company} ({(r as any).contact || [r.email, r.phone].filter(Boolean).join(" • ")})</p>
            ))}
          </div>
        </div>
      )}

      {customSections.filter(s => s.title && s.items?.length > 0).map((section, i) => (
        <div key={i}>
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-2">{section.title}</h2>
          <div className="space-y-1 text-xs">
            {section.items.map((item, ii) => (
              <p key={ii}>• {item}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
