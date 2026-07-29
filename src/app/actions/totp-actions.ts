"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateBase32Secret, verifyTOTP, generateBackupCodes } from "@/lib/totp";
import { logActivity } from "@/lib/activity-logger";
import { revalidatePath } from "next/cache";

export async function saveAdminGmail(gmail: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Oturum gerekli." };

    const cleanGmail = (gmail || "").trim().toLowerCase();
    if (!cleanGmail.endsWith("@gmail.com")) {
      return { success: false, error: "Lütfen geçerli bir @gmail.com adresi giriniz." };
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({ admin_gmail: cleanGmail })
      .eq("id", user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/profile/edit");

    logActivity({
      userId: user.id,
      actionType: "profile.admin_gmail_save",
      actionCategory: "profile",
      entityType: "profile",
      entityId: user.id,
      status: "success",
      metadata: { adminGmail: cleanGmail },
    });

    return { success: true, message: "İkincil @gmail.com adresi başarıyla kaydedildi." };
  } catch (err: any) {
    return { success: false, error: err.message || "Sunucu hatası." };
  }
}

export async function setupAdminTOTP() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Oturum gerekli." };

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role, admin_gmail")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, error: "Bu işlem sadece Admin rolü için geçerlidir." };
    }

    if (!profile.admin_gmail || !profile.admin_gmail.endsWith("@gmail.com")) {
      return { success: false, error: "Lütfen önce ikincil @gmail.com adresinizi kaydediniz." };
    }

    const secret = generateBase32Secret(20);
    const issuer = "DEU_YBS_Toplulugu";
    const label = `${issuer}:${profile.admin_gmail}`;
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

    // Gecici secret kaydet
    await adminSupabase
      .from("profiles")
      .update({ totp_secret: secret })
      .eq("id", user.id);

    return {
      success: true,
      secret,
      otpauthUrl,
      qrCodeUrl,
      adminGmail: profile.admin_gmail,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "2FA kurulumu başlatılamadı." };
  }
}

export async function verifyAndEnableAdminTOTP(code: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Oturum gerekli." };

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role, totp_secret, admin_gmail")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, error: "Bu işlem sadece Admin rolü için geçerlidir." };
    }

    if (!profile.totp_secret) {
      return { success: false, error: "Lütfen önce 2FA kurulumunu başlatın." };
    }

    const isValid = verifyTOTP(profile.totp_secret, code);
    if (!isValid) {
      return { success: false, error: "Girdiğiniz 6 haneli doğrulama kodu geçersiz." };
    }

    const backupCodes = generateBackupCodes(8);

    await adminSupabase
      .from("profiles")
      .update({
        is_2fa_enabled: true,
        totp_verified_at: new Date().toISOString(),
        backup_codes: backupCodes,
      })
      .eq("id", user.id);

    logActivity({
      userId: user.id,
      actionType: "auth.2fa_setup_success",
      actionCategory: "auth",
      entityType: "profile",
      entityId: user.id,
      status: "success",
      metadata: { adminGmail: profile.admin_gmail },
    });

    return {
      success: true,
      message: "Google Authenticator doğrulaması başarıyla tamamlandı ve aktifleştirildi!",
      backupCodes,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Doğrulama hatası." };
  }
}

export async function disableAdminTOTP(code: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Oturum gerekli." };

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role, totp_secret, is_2fa_enabled")
      .eq("id", user.id)
      .single();

    if (!profile?.is_2fa_enabled || !profile.totp_secret) {
      return { success: false, error: "2FA zaten devredışı." };
    }

    const isValid = verifyTOTP(profile.totp_secret, code);
    if (!isValid) {
      return { success: false, error: "Devre dışı bırakmak için geçerli 6 haneli 2FA kodunuzu giriniz." };
    }

    await adminSupabase
      .from("profiles")
      .update({
        is_2fa_enabled: false,
        totp_secret: null,
        backup_codes: [],
        totp_verified_at: null,
      })
      .eq("id", user.id);

    logActivity({
      userId: user.id,
      actionType: "auth.2fa_disabled",
      actionCategory: "auth",
      entityType: "profile",
      entityId: user.id,
      status: "success",
    });

    return { success: true, message: "2FA koruması başarıyla devre dışı bırakıldı." };
  } catch (err: any) {
    return { success: false, error: err.message || "Hata oluştu." };
  }
}
