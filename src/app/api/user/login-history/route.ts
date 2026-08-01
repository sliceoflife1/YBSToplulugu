import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { data: logs, error } = await supabase
      .from("activity_logs")
      .select("id, created_at, ip_address, user_agent, metadata, status")
      .eq("user_id", user.id)
      .eq("action_type", "auth.login.success")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[LoginHistoryAPI] Sorgu hatası:", error);
      return NextResponse.json({ error: "Kayıtlar çekilemedi" }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error: any) {
    console.error("[LoginHistoryAPI] Sunucu hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
