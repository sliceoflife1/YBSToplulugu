import type { SupabaseClient } from "@supabase/supabase-js";

export interface DedupNotificationRow {
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  is_read?: boolean;
  dedup_key: string;
}

export interface LegacyMatch {
  /** PostgREST filtre sözdizimiyle kolon adı, örn. "metadata->>user_id" */
  column: string;
  value: string;
}

/**
 * Bir bildirimi EN FAZLA BİR KEZ (dedup_key başına) eklemeye çalışır.
 *
 * Birincil yol: veritabanı seviyesinde atomik `ON CONFLICT DO NOTHING`
 * (bkz. supabase/migrations/039_notifications_dedup_and_healthcheck.sql,
 * (recipient_id, dedup_key) üzerindeki UNIQUE INDEX). Bu, aynı bildirimi
 * aynı anda oluşturmaya çalışan birden fazla kaynağın (DB trigger'ı,
 * /auth/callback, /api/auth/notify-registration) yarış durumuna (race
 * condition) girse bile mükerrer kayıt oluşturmamasını garanti eder.
 *
 * Yedek yol: migration henüz canlı veritabanına uygulanmadıysa (dedup_key
 * kolonu veya UNIQUE INDEX yoksa), `legacyMatch` parametresiyle verilen
 * metadata alanı üzerinden atomik OLMAYAN ama işlevsel bir
 * SELECT-then-INSERT deseniyle devam eder. Böylece bildirim sistemi
 * migration uygulanana kadar da çalışmaya devam eder; sadece bu dar zaman
 * diliminde teorik bir mükerrer kayıt riski kalır (kullanıcıya zarar
 * vermez, sadece aynı bildirimden iki tane görünebilir).
 */
export async function insertNotificationIdempotent(
  supabase: SupabaseClient,
  row: DedupNotificationRow,
  legacyMatch: LegacyMatch,
  logPrefix: string
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .upsert(
      { is_read: false, metadata: {}, ...row },
      { onConflict: "recipient_id,dedup_key", ignoreDuplicates: true }
    );

  if (!error) return;

  console.warn(
    `${logPrefix} atomik upsert başarısız oldu (muhtemelen migrations/039 uygulanmamış): ` +
    `${error.code ?? "?"} ${error.message}. SELECT-then-INSERT yedeğine geçiliyor.`
  );

  const { data: existing, error: selectError } = await supabase
    .from("notifications")
    .select("id")
    .eq("recipient_id", row.recipient_id)
    .eq("type", row.type)
    .filter(legacyMatch.column, "eq", legacyMatch.value)
    .maybeSingle();

  if (selectError) {
    console.error(`${logPrefix} yedek SELECT hatası:`, selectError);
    return;
  }

  if (existing) return;

  // dedup_key kolonu canlı veritabanında henüz olmayabilir; yedek yolda
  // bunu göndermiyoruz ki "column not found" hatası almayalım.
  const { dedup_key: _dedupKey, ...legacyRow } = { is_read: false, metadata: {}, ...row };
  void _dedupKey;

  const { error: insertError } = await supabase.from("notifications").insert(legacyRow);

  if (insertError) {
    console.error(`${logPrefix} yedek INSERT hatası:`, insertError);
  }
}
