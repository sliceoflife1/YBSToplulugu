import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Helper function: check if user is admin/moderator/faculty
async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Forbidden", status: 403 };
  }

  return { supabase, user };
}

// 1. GET: Tüm yılları listele (Admin için)
export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: yearbooks, error } = await auth.supabase!
      .from("yearbooks")
      .select("*")
      .order("year", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ yearbooks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST: Yeni yıl oluştur
export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { year, isActive } = await req.json();
    if (!year || isNaN(Number(year))) {
      return NextResponse.json({ error: "Geçersiz yıl" }, { status: 400 });
    }

    const { data, error } = await auth.supabase!
      .from("yearbooks")
      .insert({
        year: Number(year),
        is_active: isActive !== undefined ? isActive : true
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Bu yıl zaten eklenmiş." }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ yearbook: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. PATCH: Aktiflik durumunu veya yılı güncelle
export async function PATCH(req: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id, isActive } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    const { data, error } = await auth.supabase!
      .from("yearbooks")
      .update({ is_active: isActive })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ yearbook: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. DELETE: Yılı sil
export async function DELETE(req: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    const { error } = await auth.supabase!
      .from("yearbooks")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
