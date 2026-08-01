import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    logActivity({
      userId: user.id,
      actionType: "auth.login.success",
      actionCategory: "auth",
      entityType: "profile",
      entityId: user.id,
      status: "success",
      metadata: {
        method: "password",
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[LogLoginAPI] Hata:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
