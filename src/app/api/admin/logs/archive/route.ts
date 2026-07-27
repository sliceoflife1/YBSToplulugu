import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";
import { BlobServiceClient } from "@azure/storage-blob";

/**
 * POST /api/admin/logs/archive
 * 90 günden eski logları Azure Blob'a arşivleyip Supabase'den siler.
 * 2 yıldan eski Azure Blob arşivlerini de otomatik siler.
 */
export async function POST(request: Request) {
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

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffISO = cutoffDate.toISOString();

    // 1. 90 günden eski logları çek
    const { data: oldLogs, error: fetchError } = await adminSupabase
      .from("activity_logs")
      .select("*")
      .lt("created_at", cutoffISO)
      .order("created_at", { ascending: true });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let archivedCount = 0;
    let deletedFromDbCount = 0;
    let deletedFromBlobCount = 0;

    if (oldLogs && oldLogs.length > 0) {
      // 2. Azure Blob'a JSON olarak arşivle
      const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
      const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
      const containerClient = blobServiceClient.getContainerClient("activity-logs");
      await containerClient.createIfNotExists({ access: undefined });

      const archiveName = `archive_${cutoffISO.split("T")[0]}_${Date.now()}.json`;
      const blockBlobClient = containerClient.getBlockBlobClient(archiveName);
      const content = JSON.stringify(oldLogs, null, 2);
      await blockBlobClient.upload(content, Buffer.byteLength(content, "utf-8"), {
        blobHTTPHeaders: { blobContentType: "application/json" },
      });

      archivedCount = oldLogs.length;

      // 3. Arşivlenen logları Supabase'den sil
      const { error: deleteError, count } = await adminSupabase
        .from("activity_logs")
        .delete({ count: "exact" })
        .lt("created_at", cutoffISO);

      if (deleteError) {
        return NextResponse.json({ error: "Arşivleme başarılı ancak silme başarısız: " + deleteError.message }, { status: 500 });
      }
      deletedFromDbCount = count || 0;
    }

    // 4. 2 yıldan eski Azure Blob arşivlerini sil
    try {
      const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
      const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
      const containerClient = blobServiceClient.getContainerClient("activity-logs");

      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      for await (const blob of containerClient.listBlobsFlat()) {
        if (blob.properties.createdOn && blob.properties.createdOn < twoYearsAgo) {
          await containerClient.getBlockBlobClient(blob.name).delete();
          deletedFromBlobCount++;
        }
      }
    } catch (blobErr: any) {
      console.error("[Archive] Azure Blob temizlik hatası:", blobErr.message);
    }

    // 5. Supabase'den de 2 yıldan eski kalan logları temizle (güvenlik katmanı)
    const twoYearsAgoISO = new Date(Date.now() - 2 * 365.25 * 24 * 60 * 60 * 1000).toISOString();
    await adminSupabase.from("activity_logs").delete().lt("created_at", twoYearsAgoISO);

    logActivity({
      userId: user.id,
      actionType: "admin.log_archive",
      actionCategory: "admin",
      status: "success",
      metadata: {
        archivedCount,
        deletedFromDbCount,
        deletedFromBlobCount,
        cutoffDate: cutoffISO,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      archivedCount,
      deletedFromDbCount,
      deletedFromBlobCount,
      message: `${archivedCount} log arşivlendi, ${deletedFromDbCount} log Supabase'den silindi, ${deletedFromBlobCount} eski arşiv Azure'dan silindi.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
