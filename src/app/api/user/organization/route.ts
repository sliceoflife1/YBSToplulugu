import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Kullanıcının rolünü kontrol et
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "employer") {
      return NextResponse.json({ error: "Bu işlem sadece İşveren kullanıcıları içindir." }, { status: 403 });
    }

    // Sahibi olduğu organizasyonu çek
    const { data: organization, error } = await adminSupabase
      .from("organizations")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ organization });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Bir hata oluştu" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Kullanıcının rolünü kontrol et
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "employer") {
      return NextResponse.json({ error: "Bu işlem sadece İşveren kullanıcıları içindir." }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, description, website_url, contact_email, contact_phone, logo_url } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Lütfen geçerli bir şirket/kurum adı giriniz." }, { status: 400 });
    }

    // Mevcut organizasyon var mı kontrol et
    const { data: existingOrg } = await adminSupabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    const orgPayload = {
      name: name.trim(),
      type: type || "employer",
      description: description ? description.trim() : null,
      website_url: website_url ? website_url.trim() : null,
      contact_email: contact_email ? contact_email.trim() : null,
      contact_phone: contact_phone ? contact_phone.trim() : null,
      logo_url: logo_url ? logo_url.trim() : null,
      owner_id: user.id,
      approval_status: "approved",
      is_active: true,
    };

    let resultOrg;
    if (existingOrg) {
      // Güncelle
      const { data: updated, error: updateErr } = await adminSupabase
        .from("organizations")
        .update(orgPayload)
        .eq("id", existingOrg.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      resultOrg = updated;
    } else {
      // Yeni ekle
      const { data: inserted, error: insertErr } = await adminSupabase
        .from("organizations")
        .insert(orgPayload)
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      resultOrg = inserted;
    }

    // Kullanıcının profilindeki headline alanını otomatik şirket unvanı yap
    await adminSupabase
      .from("profiles")
      .update({
        headline: `${name.trim()} - İşveren Temsilcisi`
      })
      .eq("id", user.id);

    logActivity({
      userId: user.id,
      actionType: existingOrg ? "organization.update" : "organization.create",
      actionCategory: "profile",
      entityType: "organization",
      entityId: resultOrg.id,
      status: "success",
      metadata: { name, type },
      request,
    });

    return NextResponse.json({ success: true, organization: resultOrg });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Bir hata oluştu" }, { status: 500 });
  }
}
