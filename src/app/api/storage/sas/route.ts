import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  BlobServiceClient, 
  BlobSASPermissions, 
  generateBlobSASQueryParameters, 
  StorageSharedKeyCredential 
} from "@azure/storage-blob";

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Filename and contentType are required" }, { status: 400 });
    }

    // 3. Connection string parsing
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      return NextResponse.json({ error: "Azure connection string is not configured" }, { status: 500 });
    }

    const matches = connectionString.match(/AccountName=([^;]+);AccountKey=([^;]+)/);
    if (!matches) {
      return NextResponse.json({ error: "Invalid Azure connection string format" }, { status: 500 });
    }

    const accountName = matches[1];
    const accountKey = matches[2];
    const containerName = process.env.NEXT_PUBLIC_AZURE_STORAGE_CONTAINER_NAME || "community-media";

    // 4. Generate unique blob name
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueId = crypto.randomUUID();
    const blobName = `posts/${uniqueId}-${cleanFilename}`;

    // 5. Generate SAS token
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const sasToken = generateBlobSASQueryParameters({
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("w"), // write only
      startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // 5 minutes in the past for clock drift
      expiresOn: new Date(new Date().valueOf() + 30 * 60 * 1000), // 30 minutes in the future
      contentType: contentType,
    }, credential).toString();

    // 6. Construct URLs
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    const uploadUrl = `${blobClient.url}?${sasToken}`;
    const blobUrl = blobClient.url;

    return NextResponse.json({
      uploadUrl,
      blobUrl,
      blobName,
    });
  } catch (err: any) {
    console.error("SAS Token Generation Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate SAS token" }, { status: 500 });
  }
}
