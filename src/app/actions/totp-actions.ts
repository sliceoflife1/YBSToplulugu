"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateBase32Secret, verifyTOTP, generateBackupCodes } from "@/lib/totp";
import { logActivity } from "@/lib/activity-logger";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";

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

    if (profile?.role !== "admin") {
      return { success: false, error: "Bu işlem sadece Admin rolü için geçerlidir." };
    }

    // 1. Profiles tablosuna ikincil gmail adresini yaz
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({ admin_gmail: cleanGmail })
      .eq("id", user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 2. Supabase Auth (auth.users) tablosundaki e-postayı da Gmail ile senkronize et
    // Böylece mevcut şifresi aynen korunan Gmail ile Supabase Auth girişi sağlanır.
    try {
      await adminSupabase.auth.admin.updateUserById(user.id, {
        email: cleanGmail,
        email_confirm: true,
      });
    } catch (authSyncErr: any) {
      console.warn("Auth e-posta senkronizasyon uyarısı:", authSyncErr?.message);
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

    return { success: true, message: "İkincil @gmail.com adresi başarıyla kaydedildi. Şifreniz korunmuştur. Şimdi QR kod oluşturabilirsiniz!" };
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
    const issuer = "YBSToplulugu";
    const label = profile.admin_gmail;
    
    // iOS / iPhone Google Authenticator %100 uyumlu temiz TOTP URI şablonu
    const otpauthUrl = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}`;

    // Server-side base64 Data URI PNG üretimi
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // Secret'ı veritabanına kaydet
    await adminSupabase
      .from("profiles")
      .update({ totp_secret: secret })
      .eq("id", user.id);

    return {
      success: true,
      secret,
      formattedSecret: secret.match(/.{1,4}/g)?.join(" ") || secret,
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
      return { success: false, error: "Girdiğiniz 6 haneli doğrulama kodu geçersiz. Lütfen telefonunuzdaki canlı kodu kontrol edin." };
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

    // Supabase Auth e-postasının Gmail olduğundan emin ol
    if (profile.admin_gmail) {
      try {
        await adminSupabase.auth.admin.updateUserById(user.id, {
          email: profile.admin_gmail,
          email_confirm: true,
        });
      } catch (e) {
        console.warn("Auth email sync notice:", e);
      }
    }

    revalidatePath("/profile/edit");

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

    revalidatePath("/profile/edit");

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
