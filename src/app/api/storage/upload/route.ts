import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";
import { BlobServiceClient } from "@azure/storage-blob";

function getMimeType(filename: string, originalType?: string): string {
  if (originalType && originalType !== "application/octet-stream" && originalType.trim() !== "") {
    return originalType;
  }
  const ext = filename.includes(".") ? filename.substring(filename.lastIndexOf(".")).toLowerCase() : "";
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".pdf":
      return "application/pdf";
    case ".zip":
      return "application/zip";
    case ".rar":
      return "application/x-rar-compressed";
    case ".7z":
      return "application/x-7z-compressed";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
}

export async function POST(request: Request) {
  try {
    // 1. Kullanıcı oturum kontrolü
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Bu işlem için giriş yapmalısınız." }, { status: 401 });
    }

    // 2. FormData'yı ayrıştır
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Yüklenecek dosya bulunamadı." }, { status: 400 });
    }

    const filename = file.name || "screenshot.png";
    const contentType = getMimeType(filename, file.type);
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueId = crypto.randomUUID();
    const blobName = `posts/${uniqueId}-${cleanFilename}`;

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.NEXT_PUBLIC_AZURE_STORAGE_CONTAINER_NAME || "community-media";

    let blobUrl = "";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (connectionString) {
      try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Container yoksa oluşturmayı dene
        await containerClient.createIfNotExists({ access: "blob" }).catch(() => {});

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(buffer, {
          blobHTTPHeaders: {
            blobContentType: contentType,
          },
        });

        blobUrl = blockBlobClient.url;
      } catch (azureErr: any) {
        console.warn("Azure upload failed, attempting Supabase fallback:", azureErr?.message);
      }
    }

    // Azure yoksa veya hata verdiyse Supabase Storage'a yükle (Fallback)
    if (!blobUrl) {
      const adminSupabase = createAdminClient();
      
      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from("project-media")
        .upload(blobName, buffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        // avatars veya public bucket fallback
        const { data: fallbackData, error: fallbackError } = await adminSupabase.storage
          .from("avatars")
          .upload(blobName, buffer, {
            contentType,
            upsert: true,
          });

        if (fallbackError) {
          throw new Error("Depolama servisine yüklenemedi: " + (uploadError.message || fallbackError.message));
        }

        const { data: publicUrlData } = adminSupabase.storage.from("avatars").getPublicUrl(blobName);
        blobUrl = publicUrlData.publicUrl;
      } else {
        const { data: publicUrlData } = adminSupabase.storage.from("project-media").getPublicUrl(blobName);
        blobUrl = publicUrlData.publicUrl;
      }
    }

    logActivity({
      userId: user.id,
      actionType: "storage.file_upload",
      actionCategory: "storage",
      entityType: "file",
      status: "success",
      metadata: { filename, contentType, blobName, blobUrl },
      request,
    });

    return NextResponse.json({
      success: true,
      blobUrl,
      uploadUrl: blobUrl,
      url: blobUrl,
      blobName,
      filename,
    });
  } catch (err: any) {
    console.error("Storage upload route error:", err);
    return NextResponse.json(
      { error: err?.message || "Dosya yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
