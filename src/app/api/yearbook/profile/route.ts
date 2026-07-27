import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-logger"

// 1. Giriş Yapmış Kullanıcının Andıç Profilini Getir
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("yearbook_profiles")
      .select(`
        *,
        yearbook_departments (
          id,
          name,
          yearbook_faculties (
            id,
            name
          )
        )
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. Andıç Profili Oluştur (POST)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { departmentId, graduationYear, educationType, message } = body;

    if (!departmentId || !graduationYear || !educationType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("yearbook_profiles")
      .insert({
        user_id: user.id,
        department_id: departmentId,
        graduation_year: parseInt(graduationYear),
        education_type: educationType,
        message: message || null,
        is_visible: true
      })
      .select()
      .single();

    if (error) {
      logActivity({
        userId: user.id,
        actionType: "yearbook.profile_create",
        actionCategory: "yearbook",
        entityType: "yearbook_profile",
        status: "error",
        metadata: { error: error.message },
        request
      })
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logActivity({
      userId: user.id,
      actionType: "yearbook.profile_create",
      actionCategory: "yearbook",
      entityType: "yearbook_profile",
      entityId: data.id,
      status: "success",
      request
    })

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. Andıç Profilini Güncelle (PUT)
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { departmentId, graduationYear, educationType, message, isVisible } = body;

    const updatePayload: any = {};
    if (departmentId !== undefined) updatePayload.department_id = departmentId;
    if (graduationYear !== undefined) updatePayload.graduation_year = parseInt(graduationYear);
    if (educationType !== undefined) updatePayload.education_type = educationType;
    if (message !== undefined) updatePayload.message = message;
    if (isVisible !== undefined) updatePayload.is_visible = isVisible;

    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("yearbook_profiles")
      .update(updatePayload)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      logActivity({
        userId: user.id,
        actionType: "yearbook.profile_update",
        actionCategory: "yearbook",
        entityType: "yearbook_profile",
        status: "error",
        metadata: { error: error.message },
        request
      })
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logActivity({
      userId: user.id,
      actionType: "yearbook.profile_update",
      actionCategory: "yearbook",
      entityType: "yearbook_profile",
      entityId: data.id,
      status: "success",
      request
    })

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. Andıç Profilini Kalıcı Olarak Sil (DELETE)
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ON DELETE CASCADE sayesinde yearbook_entries tablosundaki arkadaş yorumları da otomatik silinir
    const { error } = await supabase
      .from("yearbook_profiles")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      logActivity({
        userId: user.id,
        actionType: "yearbook.profile_delete",
        actionCategory: "yearbook",
        entityType: "yearbook_profile",
        status: "error",
        metadata: { error: error.message },
        request // request is not defined here. Let's fix this inside chunk! Wait, DELETE() doesn't have request parameter. Let me check the file!
      })
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logActivity({
      userId: user.id,
      actionType: "yearbook.profile_delete",
      actionCategory: "yearbook",
      entityType: "yearbook_profile",
      status: "success",
      request // wait, request may not exist!
    })

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
