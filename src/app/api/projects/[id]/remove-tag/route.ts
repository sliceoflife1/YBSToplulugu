import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: project } = await adminSupabase
      .from("projects")
      .select("team_members")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı." }, { status: 404 });
    }

    const currentMembers: string[] = project.team_members || [];
    if (!currentMembers.includes(user.id)) {
      return NextResponse.json({ error: "Bu projede zaten etiketli değilsiniz." }, { status: 400 });
    }

    const updatedMembers = currentMembers.filter((mId) => mId !== user.id);

    const { error: updateError } = await adminSupabase
      .from("projects")
      .update({ team_members: updatedMembers })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json({ error: "Etiket kaldırılırken hata oluştu." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Takım arkadaşlığı etiketiniz başarıyla kaldırıldı.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Sunucu hatası" }, { status: 500 });
  }
}
