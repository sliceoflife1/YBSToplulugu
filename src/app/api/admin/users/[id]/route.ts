import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. İstek atan kullanıcının admin rolü kontrolü
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (currentProfile?.role !== "admin") {
      return NextResponse.json(
        { error: "Bu işlem için admin yetkisi gereklidir" },
        { status: 403 }
      );
    }

    // 2. Kendi kendini silmeyi engelle
    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { error: "Kendi hesabınızı bu alandan silemezsiniz." },
        { status: 400 }
      );
    }

    // 3. Profiles tablosundan sil
    const { error: deleteProfileError } = await adminSupabase
      .from("profiles")
      .delete()
      .eq("id", targetUserId);

    // 4. Auth.users tablosundan sil (var ise)
    try {
      await adminSupabase.auth.admin.deleteUser(targetUserId);
    } catch (e) {
      console.log("Auth user delete notice:", e);
    }

    if (deleteProfileError) {
      const errMsg = typeof deleteProfileError === "string" 
        ? deleteProfileError 
        : deleteProfileError.message || JSON.stringify(deleteProfileError);

      return NextResponse.json(
        { error: errMsg || "Kullanıcı veritabanından silinemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Kullanıcı başarıyla silindi." });
  } catch (error: any) {
    const errMsg = typeof error === "string" ? error : error?.message || "Sunucu hatası oluştu";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. İstek atan kullanıcının admin kontrolü
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (currentProfile?.role !== "admin") {
      return NextResponse.json(
        { error: "Bu işlem için admin yetkisi gereklidir" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { first_name, last_name, edu_email, role, department, phone, student_no, is_active } = body;

    // 2. Eğer edu_email güncellendiyse auth.users e-postasını da güncelle
    if (edu_email) {
      const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(
        targetUserId,
        { email: edu_email, email_confirm: true }
      );

      if (authUpdateError) {
        console.warn("Auth email update notice:", authUpdateError.message);
      }
    }

    // 3. Profiles tablosunu güncelle
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (edu_email !== undefined) updateData.edu_email = edu_email;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (phone !== undefined) updateData.phone = phone;
    if (student_no !== undefined) updateData.student_no = student_no;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedProfile, error: profileUpdateError } = await adminSupabase
      .from("profiles")
      .update(updateData)
      .eq("id", targetUserId)
      .select()
      .single();

    if (profileUpdateError) {
      return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}
