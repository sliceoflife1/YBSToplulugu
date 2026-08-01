import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      logActivity({
        userId: user.id,
        actionType: "auth.logout",
        actionCategory: "auth",
        entityType: "profile",
        entityId: user.id,
        status: "success",
        request,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[LogLogoutAPI] Hata:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
