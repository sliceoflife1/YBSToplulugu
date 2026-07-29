import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger"

export async function POST(
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

    // 2. Hedef kullanıcının e-postasını çek
    const { data: targetProfile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("edu_email, first_name, last_name")
      .eq("id", targetUserId)
      .single();

    if (profileError || !targetProfile?.edu_email) {
      return NextResponse.json(
        { error: "Kullanıcı e-posta adresi bulunamadı" },
        { status: 404 }
      );
    }

    // 3. Özel Türkçe HTML şablonumuz ve Resend ile şifre sıfırlama e-postası gönder
    const { sendCustomPasswordResetEmail } = await import("@/app/actions/email-actions");
    const result = await sendCustomPasswordResetEmail(targetProfile.edu_email);

    if (!result.success) {
      logActivity({
        userId: currentUser.id,
        actionType: "admin.password_reset",
        actionCategory: "admin",
        entityType: "profile",
        entityId: targetUserId,
        status: "error",
        metadata: { error: result.error },
        request
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    logActivity({
      userId: currentUser.id,
      actionType: "admin.password_reset",
      actionCategory: "admin",
      entityType: "profile",
      entityId: targetUserId,
      status: "success",
      request
    })

    return NextResponse.json({
      success: true,
      message: `${targetProfile.edu_email} adresine şifre sıfırlama e-postası başarıyla gönderildi.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}
