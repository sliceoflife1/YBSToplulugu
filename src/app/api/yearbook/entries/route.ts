import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 1. Yeni Arkadaş Yazısı Gönder (POST)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, content } = body;

    if (!recipientId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (user.id === recipientId) {
      return NextResponse.json({ error: "Kendinize andıç yazısı yazamazsınız" }, { status: 400 });
    }

    // Alıcının andıç profili var mı kontrol et
    const { data: recipientProfile } = await supabase
      .from("yearbook_profiles")
      .select("user_id")
      .eq("user_id", recipientId)
      .single();

    if (!recipientProfile) {
      return NextResponse.json({ error: "Alıcının andıç profili bulunamadı" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("yearbook_entries")
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: content,
        is_approved: false // Varsayılan olarak onay bekler
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. Arkadaş Yazısını Güncelle (Onaylama veya Düzenleme) (PUT)
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entryId, isApproved, content } = body;

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }

    // İlgili yazıyı ve alıcı/gönderen yetkisini kontrol et
    const { data: entry } = await supabase
      .from("yearbook_entries")
      .select("*")
      .eq("id", entryId)
      .single();

    if (!entry) {
      return NextResponse.json({ error: "Yazı bulunamadı" }, { status: 404 });
    }

    const updatePayload: any = {};

    if (isApproved !== undefined) {
      // Sadece alıcı (recipient) onay durumunu değiştirebilir
      if (entry.recipient_id !== user.id) {
        return NextResponse.json({ error: "Sadece alıcı bu yazıyı onaylayabilir" }, { status: 403 });
      }
      updatePayload.is_approved = isApproved;
    }

    if (content !== undefined) {
      // Sadece gönderen (sender) içeriği güncelleyebilir
      if (entry.sender_id !== user.id) {
        return NextResponse.json({ error: "Sadece yazıyı yazan kişi düzenleyebilir" }, { status: 403 });
      }
      updatePayload.content = content;
      updatePayload.is_approved = false; // Düzenlendiğinde tekrar onay sürecine girsin
    }

    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("yearbook_entries")
      .update(updatePayload)
      .eq("id", entryId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. Arkadaş Yazısını Sil (DELETE)
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }

    // Yazıyı sadece gönderen veya alıcı silebilir
    const { data: entry } = await supabase
      .from("yearbook_entries")
      .select("sender_id, recipient_id")
      .eq("id", entryId)
      .single();

    if (!entry) {
      return NextResponse.json({ error: "Yazı bulunamadı" }, { status: 404 });
    }

    if (entry.sender_id !== user.id && entry.recipient_id !== user.id) {
      return NextResponse.json({ error: "Bu yazıyı silme yetkiniz yok" }, { status: 403 });
    }

    const { error } = await supabase
      .from("yearbook_entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
