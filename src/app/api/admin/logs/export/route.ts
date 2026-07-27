import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from "@azure/storage-blob";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles").select("role, first_name, last_name").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const { startDate, endDate, format = "csv", category, filterUserId } = body;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Başlangıç ve bitiş tarihi zorunludur" }, { status: 400 });
    }

    // Logları çek
    let query = adminSupabase
      .from("activity_logs")
      .select("*, profiles!activity_logs_user_id_fkey(first_name, last_name, edu_email, role)")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false });

    if (category) query = query.eq("action_category", category);
    if (filterUserId) query = query.eq("user_id", filterUserId);

    const { data: logs, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!logs || logs.length === 0) {
      return NextResponse.json({ error: "Belirtilen tarih aralığında log kaydı bulunamadı" }, { status: 404 });
    }

    // Dosya içeriği oluştur
    let fileContent: string;
    let contentType: string;
    let fileExt: string;

    if (format === "json") {
      fileContent = JSON.stringify(logs, null, 2);
      contentType = "application/json";
      fileExt = "json";
    } else {
      // CSV formatı
      const headers = [
        "Tarih (UTC)", "Kullanıcı", "E-posta", "Rol", "Eylem Türü", "Kategori",
        "Varlık Türü", "Varlık ID", "Durum", "IP Adresi", "Tarayıcı", "Detay"
      ];
      const rows = logs.map((log: any) => {
        const p = log.profiles;
        return [
          log.created_at,
          p ? `${p.first_name} ${p.last_name}` : "Anonim",
          p?.edu_email || "-",
          p?.role || "-",
          log.action_type,
          log.action_category,
          log.entity_type || "-",
          log.entity_id || "-",
          log.status,
          log.ip_address || "-",
          (log.user_agent || "-").substring(0, 100),
          JSON.stringify(log.metadata || {}),
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
      });
      fileContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
      contentType = "text/csv; charset=utf-8";
      fileExt = "csv";
    }

    // Azure Blob'a yükle
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const accountName = connStr.match(/AccountName=([^;]+)/)?.[1] || "";
    const accountKey = connStr.match(/AccountKey=([^;]+)/)?.[1] || "";
    const containerName = "activity-logs";

    const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: undefined });

    const blobName = `logs_${startDate}_${endDate}_${Date.now()}.${fileExt}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(fileContent, Buffer.byteLength(fileContent, "utf-8"), {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    // 15 dakikalık SAS token oluştur
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const expiresOn = new Date(Date.now() + 15 * 60 * 1000);
    const sasToken = generateBlobSASQueryParameters({
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn,
    }, credential).toString();

    const downloadUrl = `${blockBlobClient.url}?${sasToken}`;

    // İndirme işlemini logla
    logActivity({
      userId: user.id,
      actionType: "admin.log_export",
      actionCategory: "admin",
      entityType: "activity_log_export",
      status: "success",
      metadata: {
        startDate,
        endDate,
        format,
        logCount: logs.length,
        fileName: blobName,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: blobName,
      logCount: logs.length,
      expiresAt: expiresOn.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Dışa aktarım sırasında hata oluştu" }, { status: 500 });
  }
}
