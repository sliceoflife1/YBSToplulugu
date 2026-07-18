"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { postSchema, commentSchema, type PostInput, type CommentInput } from "@/lib/validations/community";

/**
 * Yeni gönderi oluşturan ve ilgili Next.js önbelleklerini temizleyen sunucu eylemi.
 * 
 * Auth kontrolü normal client ile yapılır, post insert işlemi admin client ile yapılır.
 * Bu sayede RLS kuralları post insert'i engellemez.
 */
export async function createPost(data: PostInput, slug: string) {
  // Veriyi sunucu tarafında doğrula
  const parsed = postSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Geçersiz form verisi" };
  }

  const supabase = await createClient();
  
  // Oturum açmış kullanıcıyı al
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Gönderi paylaşmak için giriş yapmalısınız." };
  }

  // Admin client ile gönderiyi veritabanına ekle — RLS bypass
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.from("posts").insert({
    subreddit_id: parsed.data.subredditId,
    author_id: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
  });

  if (error) {
    console.error("Supabase gönderi oluşturma hatası:", error);
    return { error: "Gönderi oluşturulurken bir hata oluştu." };
  }

  // post_count'u manuel artır (veritabanında trigger yok)
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

  // Next.js Route Cache ve Data Cache önbelleklerini geçersiz kıl
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

  // Önbelleği temizle
  revalidatePath(`/community/${slug}/${parsed.data.postId}`);

  return { success: true };
}
