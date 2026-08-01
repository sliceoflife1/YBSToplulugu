"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";

export interface ReportSubmitParams {
  contentType: "post" | "project";
  contentId: string;
  reasonCategory: string;
  reasonDetails: string;
}

export async function submitContentReport(params: ReportSubmitParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Şikayette bulunmak için giriş yapmalısınız." };
    }

    const { contentType, contentId, reasonCategory, reasonDetails } = params;

    if (!reasonDetails || reasonDetails.trim().length < 10) {
      return { success: false, error: "Lütfen bildirim sebebinizi en az 10 karakter ile açıklayınız." };
    }

    const adminSupabase = createAdminClient();

    // Mükerrer kontrolü
    const { data: existingReport } = await adminSupabase
      .from("content_reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .maybeSingle();

    if (existingReport) {
      return { success: false, error: "Bu içeriği daha önce bildirdiniz. Bildiriminiz değerlendirme aşamasındadır." };
    }

    // Şikayeti kaydet
    const { error: insertError } = await adminSupabase
      .from("content_reports")
      .insert({
        reporter_id: user.id,
        content_type: contentType,
        content_id: contentId,
        reason_category: reasonCategory || "other",
        reason_details: reasonDetails.trim(),
        status: "pending",
      });

    if (insertError) {
      console.error("[ReportActions] Ekleme hatası:", insertError);
      if (insertError.code === "42P01" || insertError.message?.includes("does not exist")) {
        return { success: false, error: "Şikayet tablosu henüz veritabanında kurulmamış. Lütfen Supabase SQL Editor üzerinden migration 036'yı çalıştırınız." };
      }
      return { success: false, error: "Şikayet kaydedilirken bir hata oluştu: " + (insertError.message || "") };
    }

    // Log kaydı
    logActivity({
      userId: user.id,
      actionType: "content.report",
      actionCategory: contentType === "post" ? "community" : "project",
      entityType: contentType,
      entityId: contentId,
      status: "success",
      metadata: {
        reasonCategory,
        reasonDetails: reasonDetails.substring(0, 100),
      },
    });

    // Admin'leri bilgilendir (System Notification)
    try {
      const { data: admins } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          recipient_id: admin.id,
          type: "system",
          title: "Yeni İçerik Bildirimi",
          message: `${contentType === "post" ? "Bir topluluk gönderisi" : "Bir proje"} hakkında yeni bir şikayet bildirildi.`,
          metadata: { contentType, contentId },
        }));
        await adminSupabase.from("notifications").insert(notifications);
      }
    } catch (notifErr) {
      console.error("[ReportActions] Bildirim gönderme hatası:", notifErr);
    }

    return { success: true, message: "İçerik başarıyla yöneticilere bildirildi. Teşekkür ederiz." };
  } catch (err: any) {
    console.error("[ReportActions] Genel hata:", err);
    return { success: false, error: err.message || "Bir hata oluştu." };
  }
}
