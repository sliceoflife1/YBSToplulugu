"use client";

/**
 * Kayıt formlarından (organizasyon/akademisyen) çağrılır. Yeni işveren/akademisyen
 * kaydını yöneticilere bildirmesi için sunucudaki `/api/auth/notify-registration`
 * uç noktasını tetikler.
 *
 * ÖNEMLİ TASARIM KARARI: Bu çağrı BAŞARISIZ olsa bile kayıt akışını ASLA
 * engellemez / hata fırlatmaz — kullanıcı deneyimi açısından, bir arka plan
 * bildirimi gönderilemedi diye kullanıcının hesap oluşturma işlemi
 * başarısız gösterilmemelidir. Bunun yerine:
 *   - Ağ hatası / zaman aşımı durumunda 1 kez daha (kısa bir gecikmeyle) dener.
 *   - İki deneme de başarısız olursa konsola loglar ve sessizce çıkar.
 *   - Bu, tek bildirim yolu değildir: veritabanı tetikleyicisi
 *     (migrations/019) profil oluşturma anında tamamen tarayıcıdan bağımsız
 *     olarak da çalışır; bu fonksiyon ek bir güvenlik ağıdır.
 */
export async function notifyNewRegistration(userId: string): Promise<void> {
  const attempt = async () => {
    const res = await fetch("/api/auth/notify-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
      // Kullanıcı "E-posta gönderildi" ekranına geçerken sekmeyi kapatsa/sayfadan
      // ayrılsa bile isteğin tamamlanmasını sağlamaya çalışır.
      keepalive: true,
    });
    if (!res.ok) {
      throw new Error(`notify-registration ${res.status}`);
    }
  };

  try {
    await attempt();
  } catch (firstError) {
    console.warn("Yönetici bildirimi ilk denemede gönderilemedi, tekrar deneniyor:", firstError);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      await attempt();
    } catch (secondError) {
      console.error(
        "Yönetici bildirimi iki denemede de gönderilemedi. Veritabanı tetikleyicisi " +
        "(migrations/019) devreye girmiş olabilir; /admin/notifications-health üzerinden kontrol edin.",
        secondError
      );
    }
  }
}
