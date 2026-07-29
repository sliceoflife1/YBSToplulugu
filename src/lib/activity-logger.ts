import { createAdminClient } from "@/lib/supabase/server";

// Hassas alan isimleri — bu alanlar metadata'dan otomatik maskelenir
const SENSITIVE_KEYS = [
  "password", "token", "secret", "key", "authorization",
  "cookie", "session", "credit_card", "cvv", "ssn",
];

/**
 * Metadata içindeki hassas alanları [REDACTED] ile maskeler.
 */
function sanitizeMetadata(data: Record<string, any>): Record<string, any> {
  if (!data || typeof data !== "object") return data;

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Request nesnesinden IP adresi ve Port bilgisini çıkarır.
 */
function extractIpAndPort(request?: Request | { headers: { get: (name: string) => string | null } }): string | null {
  if (!request) return null;
  const headers = request.headers;

  const xForwardedFor = headers.get("x-forwarded-for");
  let rawIp =
    xForwardedFor?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    null;

  if (!rawIp) return null;

  let ip = rawIp;
  let portFromIp: string | null = null;

  if (rawIp.includes(":") && !rawIp.includes("[")) {
    const parts = rawIp.split(":");
    if (parts.length === 2 && !isNaN(Number(parts[1]))) {
      ip = parts[0];
      portFromIp = parts[1];
    }
  }

  const port =
    portFromIp ||
    headers.get("x-forwarded-port") ||
    headers.get("x-client-port") ||
    headers.get("remote-port") ||
    "443";

  const formattedIp = ip.includes(":") && !ip.startsWith("[") ? `[${ip}]` : ip;
  return `${formattedIp}:${port}`;
}

/**
 * Request nesnesinden User-Agent bilgisini çıkarır.
 */
function extractUserAgent(request?: Request | { headers: { get: (name: string) => string | null } }): string | null {
  if (!request) return null;
  return request.headers.get("user-agent") || null;
}

export type LogStatus = "success" | "error" | "unauthorized" | "blocked";

export type LogActionCategory =
  | "auth"
  | "community"
  | "project"
  | "job"
  | "admin"
  | "profile"
  | "yearbook"
  | "storage"
  | "legal";

export interface LogActivityParams {
  userId: string | null;
  actionType: string;
  actionCategory: LogActionCategory;
  entityType?: string;
  entityId?: string;
  status?: LogStatus;
  metadata?: Record<string, any>;
  request?: Request | { headers: { get: (name: string) => string | null } };
}

/**
 * Kullanıcı aktivitesini veritabanına loglar.
 * 
 * Fire-and-forget olarak çalışır — await edilmemeli, ana iş akışını bloklamaz.
 * Service role key ile yazılır (RLS bypass).
 * 
 * @example
 * // Server Action veya API Route içinde:
 * logActivity({
 *   userId: user.id,
 *   actionType: "post.create",
 *   actionCategory: "community",
 *   entityType: "post",
 *   entityId: post.id,
 *   status: "success",
 *   metadata: { title: post.title, subreddit: subreddit.slug },
 *   request: req,
 * });
 */
export function logActivity(params: LogActivityParams): void {
  // Fire-and-forget: hata olursa sessizce logla, ana akışı engelleme
  _writeLog(params).catch((err) => {
    console.error("[ActivityLogger] Log yazma hatası:", err?.message || err);
  });
}

async function _writeLog(params: LogActivityParams): Promise<void> {
  const {
    userId,
    actionType,
    actionCategory,
    entityType,
    entityId,
    status = "success",
    metadata = {},
    request,
  } = params;

  const adminSupabase = createAdminClient();

  const sanitizedMeta = sanitizeMetadata(metadata);
  const ipAddress = extractIpAndPort(request);
  const userAgent = extractUserAgent(request);

  await adminSupabase.from("activity_logs").insert({
    user_id: userId,
    action_type: actionType,
    action_category: actionCategory,
    entity_type: entityType || null,
    entity_id: entityId || null,
    status,
    ip_address: ipAddress,
    user_agent: userAgent ? userAgent.substring(0, 512) : null,
    metadata: sanitizedMeta,
  });
}
