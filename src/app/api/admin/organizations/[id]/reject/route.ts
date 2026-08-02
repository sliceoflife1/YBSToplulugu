import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: currentProfile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentProfile?.role !== "admin") {
      return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir." }, { status: 403 });
    }

    // Organizasyonu getir
    const { data: org, error: orgFetchError } = await adminSupabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (orgFetchError || !org) {
      return NextResponse.json({ error: "Organizasyon bulunamadı." }, { status: 404 });
    }

    // Organizasyon onay durumunu reddedildi olarak güncelle
    const { error: updateError } = await adminSupabase
      .from("organizations")
      .update({
        approval_status: "rejected",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", orgId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // İşverene bildirim gönder
    if (org.owner_id) {
      await adminSupabase.from("notifications").insert({
        recipient_id: org.owner_id,
        type: "system",
        title: "Kuruluş Başvurunuz Onaylanmadı",
        message: `${org.name} kuruluş başvurunuz incelenmiş ve onaylanmamıştır.`,
        metadata: { link: "/dashboard" },
      });
    }

    logActivity({
      userId: user.id,
      actionType: "admin.organization_reject",
      actionCategory: "admin",
      entityType: "organization",
      entityId: orgId,
      status: "success",
      request,
    });

    const url = new URL(request.url);
    const redirectUrl = new URL("/admin", url.origin);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Sunucu hatası" }, { status: 500 });
  }
}
