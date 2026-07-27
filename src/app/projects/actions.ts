"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";
import { projectCommentSchema, type ProjectCommentInput, type ProjectInput } from "@/lib/validations/profile";

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
      logActivity({
        userId: user.id,
        actionType: "project.upvote",
        actionCategory: "project",
        entityType: "project",
        entityId: projectId,
        status: "error",
        metadata: { error: deleteError.message, action: "unvote" }
      });
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
      logActivity({
        userId: user.id,
        actionType: "project.upvote",
        actionCategory: "project",
        entityType: "project",
        entityId: projectId,
        status: "error",
        metadata: { error: insertError.message, action: "upvote" }
      });
      return { error: "Oy verilirken hata oluştu." };
    }
  }

  // Önbellekleri temizle
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  logActivity({
    userId: user.id,
    actionType: "project.upvote",
    actionCategory: "project",
    entityType: "project",
    entityId: projectId,
    status: "success",
    metadata: { hasUpvoted: !existingUpvote }
  });

  return { success: true, hasUpvoted: !existingUpvote };
}

/**
 * Projeyi düzenleyen Server Action.
 */
export async function editProject(projectId: string, data: Partial<ProjectInput>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Yetkisiz erişim" };

  const adminSupabase = createAdminClient();

  // Yetki Kontrolü
  const { data: project } = await adminSupabase.from("projects").select("user_id").eq("id", projectId).single();
  if (!project) return { error: "Proje bulunamadı" };

  const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  if (project.user_id !== user.id && !isAdmin) {
    return { error: "Bu projeyi düzenleme yetkiniz yok." };
  }

  const { error } = await adminSupabase
    .from("projects")
    .update({
      title: data.title,
      description: data.description,
      technologies: data.technologies,
      github_url: data.githubUrl || null,
      youtube_url: data.youtubeUrl || null,
      behance_url: data.behanceUrl || null,
      external_url: data.externalUrl || null,
      semester: data.semester || null,
      year: data.year || null,
      media_urls: data.mediaUrls || [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    console.error("Proje düzenleme hatası:", error);
    logActivity({
      userId: user.id,
      actionType: "project.edit",
      actionCategory: "project",
      entityType: "project",
      entityId: projectId,
      status: "error",
      metadata: { error: error.message }
    });
    return { error: "Proje güncellenirken hata oluştu." };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  logActivity({
    userId: user.id,
    actionType: "project.edit",
    actionCategory: "project",
    entityType: "project",
    entityId: projectId,
    status: "success",
    metadata: { title: data.title }
  });

  return { success: true };
}

/**
 * Projeyi silen Server Action.
 */
export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Yetkisiz erişim" };

  const adminSupabase = createAdminClient();

  // Yetki Kontrolü
  const { data: project } = await adminSupabase.from("projects").select("user_id").eq("id", projectId).single();
  if (!project) return { error: "Proje zaten silinmiş" };

  const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  if (project.user_id !== user.id && !isAdmin) {
    return { error: "Bu projeyi silme yetkiniz yok." };
  }

  const { error } = await adminSupabase.from("projects").delete().eq("id", projectId);

  if (error) {
    console.error("Proje silme hatası:", error);
    logActivity({
      userId: user.id,
      actionType: "project.delete",
      actionCategory: "project",
      entityType: "project",
      entityId: projectId,
      status: "error",
      metadata: { error: error.message }
    });
    return { error: "Proje silinirken hata oluştu." };
  }

  revalidatePath("/projects");

  logActivity({
    userId: user.id,
    actionType: "project.delete",
    actionCategory: "project",
    entityType: "project",
    entityId: projectId,
    status: "success"
  });

  return { success: true };
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
    logActivity({
      userId: user.id,
      actionType: "project_comment.create",
      actionCategory: "project",
      entityType: "project_comment",
      status: "error",
      metadata: { error: error.message, projectId: parsed.data.projectId }
    });
    return { error: "Yorum eklenirken bir hata oluştu." };
  }

  revalidatePath(`/projects/${parsed.data.projectId}`);

  logActivity({
    userId: user.id,
    actionType: "project_comment.create",
    actionCategory: "project",
    entityType: "project_comment",
    status: "success",
    metadata: { projectId: parsed.data.projectId }
  });

  return { success: true };
}

/**
 * Proje yorumu düzenleyen Server Action.
 */
export async function editProjectComment(commentId: string, content: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Yetkisiz erişim" };

  const adminSupabase = createAdminClient();

  // Yetki Kontrolü
  const { data: comment } = await adminSupabase.from("project_comments").select("author_id").eq("id", commentId).single();
  if (!comment) return { error: "Yorum bulunamadı" };

  const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  if (comment.author_id !== user.id && !isAdmin) {
    return { error: "Bu yorumu düzenleme yetkiniz yok." };
  }

  const { error } = await adminSupabase
    .from("project_comments")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", commentId);

  if (error) {
    console.error("Proje yorumu düzenleme hatası:", error);
    logActivity({
      userId: user.id,
      actionType: "project_comment.edit",
      actionCategory: "project",
      entityType: "project_comment",
      entityId: commentId,
      status: "error",
      metadata: { error: error.message }
    });
    return { error: "Yorum güncellenirken hata oluştu." };
  }

  revalidatePath(`/projects/${projectId}`);

  logActivity({
    userId: user.id,
    actionType: "project_comment.edit",
    actionCategory: "project",
    entityType: "project_comment",
    entityId: commentId,
    status: "success",
    metadata: { projectId }
  });

  return { success: true };
}

/**
 * Proje yorumu silen Server Action.
 */
export async function deleteProjectComment(commentId: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Yetkisiz erişim" };

  const adminSupabase = createAdminClient();

  // Yetki Kontrolü
  const { data: comment } = await adminSupabase.from("project_comments").select("author_id").eq("id", commentId).single();
  if (!comment) return { error: "Yorum zaten silinmiş" };

  const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  if (comment.author_id !== user.id && !isAdmin) {
    return { error: "Bu yorumu silme yetkiniz yok." };
  }

  const { error } = await adminSupabase.from("project_comments").delete().eq("id", commentId);

  if (error) {
    console.error("Proje yorumu silme hatası:", error);
    logActivity({
      userId: user.id,
      actionType: "project_comment.delete",
      actionCategory: "project",
      entityType: "project_comment",
      entityId: commentId,
      status: "error",
      metadata: { error: error.message }
    });
    return { error: "Yorum silinirken hata oluştu." };
  }

  revalidatePath(`/projects/${projectId}`);

  logActivity({
    userId: user.id,
    actionType: "project_comment.delete",
    actionCategory: "project",
    entityType: "project_comment",
    entityId: commentId,
    status: "success",
    metadata: { projectId }
  });

  return { success: true };
}
