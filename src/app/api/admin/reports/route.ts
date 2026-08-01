import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles").select("role").eq("id", user.id).single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "";

    let query = adminSupabase
      .from("content_reports")
      .select(`
        *,
        reporter:reporter_id(id, first_name, last_name, edu_email, role)
      `)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data: reports, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Her rapor için ilgili post veya projenin mevcut detaylarını çek
    const enrichedReports = await Promise.all(
      (reports || []).map(async (report) => {
        let contentDetails = null;
        if (report.content_type === "post") {
          const { data: post } = await adminSupabase
            .from("posts")
            .select("id, title, content, author_id, subreddits:subreddit_id(slug)")
            .eq("id", report.content_id)
            .maybeSingle();
          contentDetails = post;
        } else if (report.content_type === "project") {
          const { data: project } = await adminSupabase
            .from("projects")
            .select("id, title, description, owner_id")
            .eq("id", report.content_id)
            .maybeSingle();
          contentDetails = project;
        }
        return { ...report, contentDetails };
      })
    );

    return NextResponse.json({ reports: enrichedReports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles").select("role").eq("id", user.id).single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { reportId, action, deleteContent, adminNote } = await request.json();

    if (!reportId || !action) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    const { data: report } = await adminSupabase
      .from("content_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (!report) {
      return NextResponse.json({ error: "Şikayet kaydı bulunamadı" }, { status: 404 });
    }

    let newStatus = action === "dismiss" ? "dismissed" : "actioned";

    // Eğer içeriğin kendisini de silmesi istenmişse
    if (deleteContent && report.content_id) {
      if (report.content_type === "post") {
        await adminSupabase
          .from("posts")
          .delete()
          .eq("id", report.content_id);
      } else if (report.content_type === "project") {
        await adminSupabase
          .from("projects")
          .delete()
          .eq("id", report.content_id);
      }
    }

    const updatePayload: Record<string, any> = {
      status: newStatus,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    };

    if (typeof adminNote === "string") {
      updatePayload.admin_note = adminNote.trim();
    }

    // Şikayet durumunu güncelle
    let { error: updateErr } = await adminSupabase
      .from("content_reports")
      .update(updatePayload)
      .eq("id", reportId);

    // Eğer admin_note kolonu veritabanında yoksa, kolon hatası verir; fallback olarak nedene ekle
    if (updateErr && updateErr.message?.includes("admin_note")) {
      delete updatePayload.admin_note;
      if (typeof adminNote === "string") {
        const cleanDetails = (report.reason_details || "").split("\n\n[YÖNETİCİ NOTU]:")[0];
        updatePayload.reason_details = `${cleanDetails}\n\n[YÖNETİCİ NOTU]: ${adminNote.trim()}`;
      }
      const fallbackRes = await adminSupabase
        .from("content_reports")
        .update(updatePayload)
        .eq("id", reportId);
      updateErr = fallbackRes.error;
    }

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Activity log
    logActivity({
      userId: user.id,
      actionType: "admin.report_resolve",
      actionCategory: "admin",
      entityType: "content_report",
      entityId: reportId,
      status: "success",
      metadata: { action, deleteContent, contentType: report.content_type, contentId: report.content_id },
      request,
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
