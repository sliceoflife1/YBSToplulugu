import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Giriş kontrolü
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Bulunulan yılı bul
    const currentYear = new Date().getFullYear();

    // 3. Bulunulan yılın veritabanında kayıtlı olup olmadığını kontrol et
    const { data: existingYear } = await supabase
      .from("yearbooks")
      .select("year")
      .eq("year", currentYear)
      .maybeSingle();

    // 4. Eğer bulunulan yıl kayıtlı değilse otomatik olarak EKLE (1 Ocak tetikleyicisi)
    if (!existingYear) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (serviceRoleKey && supabaseUrl) {
        // Service role kullanarak güvenli ve yetki kısıtı olmadan yılı ekleyelim
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false }
        });
        await adminClient.from("yearbooks").insert({ year: currentYear, is_active: true });
      } else {
        // Fallback: normal client ile dene
        await supabase.from("yearbooks").insert({ year: currentYear, is_active: true });
      }
    }

    // 5. Aktif yılları çek
    const { data: periods, error } = await supabase
      .from("yearbooks")
      .select("*")
      .eq("is_active", true)
      .order("year", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ periods });
  } catch (err: any) {
    console.error("Yearbook periods error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
