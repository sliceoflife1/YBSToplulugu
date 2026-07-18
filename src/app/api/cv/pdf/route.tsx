import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { CvPdf } from "@/components/cv/cv-pdf";
import {
  normalizeEducationList,
  normalizeExperienceList,
  parseJsonArray,
} from "@/lib/cv/normalize";
import type { Profile, CvData } from "@/types/database";

// @react-pdf/renderer, fontkit üzerinden dosya sistemine (Node.js) ihtiyaç duyar
// ve tarayıcıya özel şifreleme kısayolları (SHA224 vb.) production build'lerinde
// hataya sebep olabildiği için PDF üretimi kasıtlı olarak sunucu tarafında
// (bu route içinde) yapılır; istemci tarafında hiçbir react-pdf kodu çalışmaz.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9-_]+/g, "_").replace(/_+/g, "_");
}

function pdfResponse(buffer: Buffer, profile: { first_name: string; last_name: string }) {
  const fileName = `CV_${sanitizeFileName(profile.first_name)}_${sanitizeFileName(profile.last_name)}.pdf`;
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * GET /api/cv/pdf?userId=<id>
 * Veritabanında kayıtlı (kaydedilmiş) CV verisinden PDF üretir.
 * Herkese açık CV'ler (is_cv_public) için serbesttir; gizli CV'ler için
 * sadece profil sahibi, admin/moderatör veya onaylı işveren erişebilir.
 * /u/[id] (profil sayfası) ve /talent (yetenek havuzu) tarafından kullanılır.
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return new Response(JSON.stringify({ error: "userId parametresi gerekli" }), { status: 400 });
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<Profile>();

  if (!profile) {
    return new Response(JSON.stringify({ error: "Profil bulunamadı" }), { status: 404 });
  }

  if (!profile.is_cv_public) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Bu CV herkese açık değil" }), { status: 403 });
    }

    let isAuthorized = user.id === profile.id;

    if (!isAuthorized) {
      const { data: viewerProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (viewerProfile?.role === "admin" || viewerProfile?.role === "moderator") {
        isAuthorized = true;
      } else {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", user.id)
          .eq("type", "employer")
          .eq("approval_status", "approved")
          .limit(1);
        isAuthorized = Boolean(orgs && orgs.length > 0);
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Bu CV'ye erişim yetkiniz yok" }), { status: 403 });
    }
  }

  const { data: cvData } = await supabase
    .from("cv_data")
    .select("*")
    .eq("user_id", userId)
    .single<CvData>();

  const buffer = await renderToBuffer(
    <CvPdf
      profile={profile}
      cvData={cvData}
      skills={cvData?.skills || []}
      education={normalizeEducationList(cvData?.education)}
      experience={normalizeExperienceList(cvData?.experience)}
      certifications={parseJsonArray(cvData?.certifications)}
      languages={parseJsonArray(cvData?.languages)}
      projects={parseJsonArray(cvData?.projects)}
      references={parseJsonArray(cvData?.references)}
      customSections={parseJsonArray(cvData?.custom_sections)}
      templateName={cvData?.template_name || "modern"}
      primaryColor={cvData?.primary_color || "#3B82F6"}
    />
  );

  return pdfResponse(buffer, profile);
}

/**
 * POST /api/cv/pdf
 * Kullanıcının CV editöründe henüz kaydetmediği taslak veriden anlık PDF üretir.
 * Sadece giriş yapmış kullanıcılar kendi taslakları için kullanabilir.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Giriş yapmanız gerekiyor" }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.profile) {
    return new Response(JSON.stringify({ error: "Geçersiz istek" }), { status: 400 });
  }

  const profile: Profile = body.profile;

  const buffer = await renderToBuffer(
    <CvPdf
      profile={profile}
      cvData={null}
      skills={Array.isArray(body.skills) ? body.skills : []}
      education={normalizeEducationList(body.education)}
      experience={normalizeExperienceList(body.experience)}
      certifications={Array.isArray(body.certifications) ? body.certifications : []}
      languages={Array.isArray(body.languages) ? body.languages : []}
      projects={Array.isArray(body.projects) ? body.projects : []}
      references={Array.isArray(body.references) ? body.references : []}
      customSections={Array.isArray(body.customSections) ? body.customSections : []}
      templateName={body.templateName || "modern"}
      primaryColor={body.primaryColor || "#3B82F6"}
    />
  );

  return pdfResponse(buffer, { first_name: profile.first_name || "CV", last_name: profile.last_name || user.id });
}
