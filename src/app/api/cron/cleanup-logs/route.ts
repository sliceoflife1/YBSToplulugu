import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { BlobServiceClient } from "@azure/storage-blob";

/**
 * Vercel Cron Job — Günlük otomatik temizlik.
 * 1. 90 günden eski logları Azure Blob'a arşivler ve Supabase'den siler
 * 2. 2 yıldan eski Azure Blob arşivlerini siler
 * 
 * vercel.json'da cron olarak yapılandırılır.
 */
export async function GET(request: Request) {
  // Vercel Cron güvenlik kontrolü
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminSupabase = createAdminClient();

    // 1. 90 günden eski logları arşivle
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffISO = cutoffDate.toISOString();

    const { data: oldLogs } = await adminSupabase
      .from("activity_logs")
      .select("*")
      .lt("created_at", cutoffISO)
      .order("created_at", { ascending: true });

    let archivedCount = 0;
    let deletedFromDbCount = 0;
    let deletedFromBlobCount = 0;

    if (oldLogs && oldLogs.length > 0) {
      const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
      const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
      const containerClient = blobServiceClient.getContainerClient("activity-logs");
      await containerClient.createIfNotExists({ access: undefined });

      const archiveName = `auto_archive_${cutoffISO.split("T")[0]}_${Date.now()}.json`;
      const blockBlobClient = containerClient.getBlockBlobClient(archiveName);
      const content = JSON.stringify(oldLogs, null, 2);
      await blockBlobClient.upload(content, Buffer.byteLength(content, "utf-8"), {
        blobHTTPHeaders: { blobContentType: "application/json" },
      });
      archivedCount = oldLogs.length;

      const { count } = await adminSupabase
        .from("activity_logs")
        .delete({ count: "exact" })
        .lt("created_at", cutoffISO);
      deletedFromDbCount = count || 0;
    }

    // 2. 2 yıldan eski Azure Blob arşivlerini sil
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
      console.error("[Cron] Azure Blob temizlik hatası:", blobErr.message);
    }

    // 3. Supabase'den de 2 yıldan eski kalan logları temizle
    const twoYearsAgoISO = new Date(Date.now() - 2 * 365.25 * 24 * 60 * 60 * 1000).toISOString();
    await adminSupabase.from("activity_logs").delete().lt("created_at", twoYearsAgoISO);

    console.log(`[Cron Cleanup] Archived: ${archivedCount}, DB deleted: ${deletedFromDbCount}, Blob deleted: ${deletedFromBlobCount}`);

    return NextResponse.json({
      success: true,
      archivedCount,
      deletedFromDbCount,
      deletedFromBlobCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Cron Cleanup] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
