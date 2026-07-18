"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { projectCommentSchema, type ProjectCommentInput } from "@/lib/validations/profile";

/**
 * Projeyi oylayan (upvote) veya oyu geri alan Server Action.
 */
export async function upvoteProject(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oy kullanmak için giriş yapmalısınız." };
  }

  const adminSupabase = createAdminClient();

  // Kullanıcının daha önce oy verip vermediğini kontrol et
  const { data: existingUpvote, error: checkError } = await adminSupabase
    .from("project_upvotes")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (checkError) {
    console.error("Upvote kontrol hatası:", checkError);
    return { error: "Oylama durumu kontrol edilirken hata oluştu." };
  }

  if (existingUpvote) {
    // Oy varsa sil (unvote)
    const { error: deleteError } = await adminSupabase
      .from("project_upvotes")
      .delete()
      .eq("id", existingUpvote.id);

    if (deleteError) {
      console.error("Upvote silme hatası:", deleteError);
      return { error: "Oy iptal edilirken hata oluştu." };
    }
  } else {
    // Oy yoksa ekle (upvote)
    const { error: insertError } = await adminSupabase
      .from("project_upvotes")
      .insert({
        project_id: projectId,
        user_id: user.id,
      });

    if (insertError) {
      console.error("Upvote ekleme hatası:", insertError);
      return { error: "Oy verilirken hata oluştu." };
    }
  }

  // Önbellekleri temizle
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  return { success: true, hasUpvoted: !existingUpvote };
}

/**
 * Projeye yorum veya yanıt ekleyen Server Action.
 */
export async function createProjectComment(data: ProjectCommentInput) {
  const parsed = projectCommentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Geçersiz yorum verisi" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Yorum yapmak için giriş yapmalısınız." };
  }

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("project_comments")
    .insert({
      project_id: parsed.data.projectId,
      author_id: user.id,
      parent_id: parsed.data.parentId || null,
      content: parsed.data.content,
    });

  if (error) {
    console.error("Yorum ekleme hatası:", error);
    return { error: "Yorum eklenirken bir hata oluştu." };
  }

  // Detay sayfasının önbelleğini temizle
  revalidatePath(`/projects/${parsed.data.projectId}`);

  return { success: true };
}
