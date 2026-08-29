import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger"

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

    // 3. Bağımlı verileri temizle (Foreign Key çakışmalarını önlemek için)
    try {
      // a) Kullanıcının yaptığı ve aldığı ilan başvurularını sil
      await adminSupabase.from("job_applications").delete().eq("applicant_id", targetUserId);
      
      // Kullanıcının ilanlarının ID'lerini bul ve bu ilanlara yapılan başvuruları sil
      const { data: userJobs } = await adminSupabase.from("job_listings").select("id").eq("employer_id", targetUserId);
      if (userJobs && userJobs.length > 0) {
        const jobIds = userJobs.map(j => j.id);
        await adminSupabase.from("job_applications").delete().in("job_listing_id", jobIds);
      }

      // b) Kullanıcının oluşturduğu iş ilanlarını sil
      await adminSupabase.from("job_listings").delete().eq("employer_id", targetUserId);

      // c) Kullanıcının sahibi olduğu organizasyonları sil
      await adminSupabase.from("organizations").delete().eq("owner_id", targetUserId);

      // d) Bildirimleri, onayları ve yıllık kayıtlarını temizle
      await adminSupabase.from("notifications").delete().eq("recipient_id", targetUserId);
      await adminSupabase.from("user_legal_consents").delete().eq("user_id", targetUserId);
      await adminSupabase.from("yearbook_entries").delete().eq("user_id", targetUserId);
      await adminSupabase.from("yearbook_profiles").delete().eq("user_id", targetUserId);

      // e) Projelerini ve yorumlarını temizle
      await adminSupabase.from("project_upvotes").delete().eq("user_id", targetUserId);
      await adminSupabase.from("project_comments").delete().eq("user_id", targetUserId);
      await adminSupabase.from("projects").delete().eq("user_id", targetUserId);
    } catch (cleanError) {
      console.warn("Dependent data cleanup notice:", cleanError);
    }

    // 4. Profiles tablosundan sil
    const { error: deleteProfileError } = await adminSupabase
      .from("profiles")
      .delete()
      .eq("id", targetUserId);

    // 5. Auth.users tablosundan sil (var ise)
    try {
      await adminSupabase.auth.admin.deleteUser(targetUserId);
    } catch (e) {
      console.log("Auth user delete notice:", e);
    }

    if (deleteProfileError) {
      const errMsg = typeof deleteProfileError === "string" 
        ? deleteProfileError 
        : deleteProfileError.message || JSON.stringify(deleteProfileError);

      logActivity({
        userId: currentUser.id,
        actionType: "admin.user_delete",
        actionCategory: "admin",
        entityType: "profile",
        entityId: targetUserId,
        status: "error",
        metadata: { error: errMsg },
        request
      })

      return NextResponse.json(
        { error: errMsg || "Kullanıcı veritabanından silinemedi" },
        { status: 500 }
      );
    }

    logActivity({
      userId: currentUser.id,
      actionType: "admin.user_delete",
      actionCategory: "admin",
      entityType: "profile",
      entityId: targetUserId,
      status: "success",
      request
    })

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
    const { first_name, last_name, edu_email, role, department, phone, student_no, is_active, admin_gmail } = body;

    // Hedef profilin mevcut bilgilerini çek
    const { data: targetProfile } = await adminSupabase
      .from("profiles")
      .select("admin_gmail, personal_email, edu_email, role")
      .eq("id", targetUserId)
      .single();

    // Admin Gmail çözümlemesi
    let resolvedAdminGmail: string | null = null;
    if (admin_gmail !== undefined) {
      resolvedAdminGmail = (typeof admin_gmail === "string" && admin_gmail.trim() !== "")
        ? admin_gmail.trim().toLowerCase()
        : null;
      if (resolvedAdminGmail && !resolvedAdminGmail.endsWith("@gmail.com")) {
        return NextResponse.json(
          { error: "Admin güvenlik e-postası geçerli bir @gmail.com adresi olmalıdır." },
          { status: 400 }
        );
      }
    }

    // Admin rolü verilmek isteniyorsa @gmail.com zorunluluğu kontrolü ve otomatik eşleme
    if (role === "admin") {
      if (!resolvedAdminGmail) {
        if (targetProfile?.admin_gmail && targetProfile.admin_gmail.toLowerCase().endsWith("@gmail.com")) {
          resolvedAdminGmail = targetProfile.admin_gmail.toLowerCase();
        } else if (targetProfile?.personal_email && targetProfile.personal_email.toLowerCase().endsWith("@gmail.com")) {
          resolvedAdminGmail = targetProfile.personal_email.toLowerCase();
        } else if (edu_email && edu_email.toLowerCase().endsWith("@gmail.com")) {
          resolvedAdminGmail = edu_email.toLowerCase();
        } else if (targetProfile?.edu_email && targetProfile.edu_email.toLowerCase().endsWith("@gmail.com")) {
          resolvedAdminGmail = targetProfile.edu_email.toLowerCase();
        }
      }

      if (!resolvedAdminGmail || !resolvedAdminGmail.endsWith("@gmail.com")) {
        return NextResponse.json(
          { error: "Bu kullanıcının Admin olabilmesi için geçerli bir @gmail.com adresi (Kişisel E-posta veya Admin Gmail olarak) tanımlanmalıdır." },
          { status: 400 }
        );
      }
    }

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
    if (student_no !== undefined) {
      updateData.student_no =
        student_no && typeof student_no === "string" && student_no.trim() !== ""
          ? student_no.trim()
          : null;
    }
    if (is_active !== undefined) updateData.is_active = is_active;
    if (resolvedAdminGmail !== null) {
      updateData.admin_gmail = resolvedAdminGmail;
    } else if (admin_gmail === "" || admin_gmail === null) {
      updateData.admin_gmail = null;
    }

    const { data: updatedProfile, error: profileUpdateError } = await adminSupabase
      .from("profiles")
      .update(updateData)
      .eq("id", targetUserId)
      .select()
      .single();

    if (profileUpdateError) {
      logActivity({
        userId: currentUser.id,
        actionType: "admin.user_role_change",
        actionCategory: "admin",
        entityType: "profile",
        entityId: targetUserId,
        status: "error",
        metadata: { error: profileUpdateError.message },
        request
      })
      return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
    }

    logActivity({
      userId: currentUser.id,
      actionType: "admin.user_role_change",
      actionCategory: "admin",
      entityType: "profile",
      entityId: targetUserId,
      status: "success",
      metadata: { role: updateData.role },
      request
    })

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}
