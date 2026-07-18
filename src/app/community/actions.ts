"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { postSchema, commentSchema, type PostInput, type CommentInput } from "@/lib/validations/community";

/**
 * Yeni gönderi oluşturan ve ilgili Next.js önbelleklerini temizleyen sunucu eylemi.
 */
export async function createPost(data: PostInput, slug: string) {
  const parsed = postSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Geçersiz form verisi" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Gönderi paylaşmak için giriş yapmalısınız." };
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.from("posts").insert({
    subreddit_id: parsed.data.subredditId,
    author_id: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    media_urls: parsed.data.mediaUrls || [],
    youtube_url: parsed.data.youtubeUrl || null,
  });

  if (error) {
    console.error("Supabase gönderi oluşturma hatası:", error);
    return { error: "Gönderi oluşturulurken bir hata oluştu." };
  }

  // post_count'u manuel artır
  const { data: currentSub } = await adminSupabase
    .from("subreddits")
    .select("post_count")
    .eq("id", parsed.data.subredditId)
    .single();

  if (currentSub) {
    await adminSupabase
      .from("subreddits")
      .update({ post_count: (currentSub.post_count || 0) + 1 })
      .eq("id", parsed.data.subredditId);
  }

  revalidatePath("/community");
  revalidatePath(`/community/${slug}`);

  return { success: true };
}

/**
 * Gönderi düzenleyen sunucu eylemi (yazar veya admin yetkili).
 */
export async function editPost(
  postId: string,
  data: { title: string; content: string; mediaUrls?: string[]; youtubeUrl?: string | null },
  slug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Yetkisiz erişim" };

  const adminSupabase = createAdminClient();

  // Yetki Kontrolü
  const { data: post } = await adminSupabase.from("posts").select("author_id").eq("id", postId).single();
  if (!post) return { error: "Gönderi bulunamadı" };

  const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  if (post.author_id !== user.id && !isAdmin) {
    return { error: "Bu gönderiyi düzenleme yetkiniz yok." };
  }

  const { error } = await adminSupabase
    .from("posts")
    .update({
      title: data.title,
      content: data.content,
      media_urls: data.mediaUrls || [],
      youtube_url: data.youtubeUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    console.error("Gönderi düzenleme hatası:", error);
    return { error: "Gönderi güncellenirken hata oluştu." };
  }

  revalidatePath("/community");
  revalidatePath(`/community/${slug}`);
  revalidatePath(`/community/${slug}/${postId}`);

  return { success: true };
}

/**
 * Gönderi silen sunucu eylemi.
 */
export async function deletePost(postId: string, subredditId: string, slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Yetkisiz erişim" };

  const adminSupabase = createAdminClient();

  // Yetki Kontrolü
  const { data: post } = await adminSupabase.from("posts").select("author_id").eq("id", postId).single();
  if (!post) return { error: "Gönderi zaten silinmiş" };

  const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  if (post.author_id !== user.id && !isAdmin) {
    return { error: "Bu gönderiyi silme yetkiniz yok." };
  }

  const { error } = await adminSupabase.from("posts").delete().eq("id", postId);

  if (error) {
    console.error("Gönderi silme hatası:", error);
    return { error: "Gönderi silinirken hata oluştu." };
  }

  // post_count'u azalt
  const { data: currentSub } = await adminSupabase
    .from("subreddits")
    .select("post_count")
    .eq("id", subredditId)
    .single();

  if (currentSub && currentSub.post_count > 0) {
    await adminSupabase
      .from("subreddits")
      .update({ post_count: currentSub.post_count - 1 })
      .eq("id", subredditId);
  }

  revalidatePath("/community");
  revalidatePath(`/community/${slug}`);

  return { success: true };
}

/**
 * Gönderiye yeni bir yorum ekleyen sunucu eylemi.
 */
export async function createComment(data: CommentInput, slug: string) {
  const parsed = commentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Geçersiz yorum verisi" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Yorum yapmak için giriş yapmalısınız." };
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.from("comments").insert({
    post_id: parsed.data.postId,
    author_id: user.id,
    parent_id: parsed.data.parentId || null,
    content: parsed.data.content,
  });

  if (error) {
    console.error("Supabase yorum ekleme hatası:", error);
    return { error: "Yorum eklenirken bir hata oluştu." };
  }

  revalidatePath(`/community/${slug}/${parsed.data.postId}`);

  return { success: true };
}

/**
 * Yorum düzenleyen sunucu eylemi.
 */
export async function editComment(commentId: string, content: string, slug: string, postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Yetkisiz erişim" };

  const adminSupabase = createAdminClient();

  // Yetki Kontrolü
  const { data: comment } = await adminSupabase.from("comments").select("author_id").eq("id", commentId).single();
  if (!comment) return { error: "Yorum bulunamadı" };

  const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  if (comment.author_id !== user.id && !isAdmin) {
    return { error: "Bu yorumu düzenleme yetkiniz yok." };
  }

  const { error } = await adminSupabase
    .from("comments")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", commentId);

  if (error) {
    console.error("Yorum düzenleme hatası:", error);
    return { error: "Yorum güncellenirken hata oluştu." };
  }

  revalidatePath(`/community/${slug}/${postId}`);

  return { success: true };
}

/**
 * Yorum silen sunucu eylemi.
 */
export async function deleteComment(commentId: string, postId: string, slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Yetkisiz erişim" };

  const adminSupabase = createAdminClient();

  // Yetki Kontrolü
  const { data: comment } = await adminSupabase.from("comments").select("author_id").eq("id", commentId).single();
  if (!comment) return { error: "Yorum zaten silinmiş" };

  const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  if (comment.author_id !== user.id && !isAdmin) {
    return { error: "Bu yorumu silme yetkiniz yok." };
  }

  const { error } = await adminSupabase.from("comments").delete().eq("id", commentId);

  if (error) {
    console.error("Yorum silme hatası:", error);
    return { error: "Yorum silinirken hata oluştu." };
  }

  revalidatePath(`/community/${slug}/${postId}`);

  return { success: true };
}
