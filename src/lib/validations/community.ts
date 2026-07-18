import { z } from 'zod/v4';

export const postSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır').max(200, 'Başlık en fazla 200 karakter olabilir'),
  content: z.string().min(10, 'İçerik en az 10 karakter olmalıdır').max(10000, 'İçerik en fazla 10000 karakter olabilir'),
  subredditId: z.string().uuid('Geçersiz topluluk kimliği'),
  mediaUrls: z.array(z.string()).optional(),
  youtubeUrl: z.string().url('Geçersiz YouTube URL').or(z.literal('')).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Yorum boş olamaz').max(2000, 'Yorum en fazla 2000 karakter olabilir'),
  postId: z.string().uuid('Geçersiz gönderi kimliği'),
  parentId: z.string().uuid().optional(),
});

export const subredditSchema = z.object({
  name: z.string().min(3, 'İsim en az 3 karakter olmalıdır').max(50),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır').max(500),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir renk kodu giriniz').optional(),
});

export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type SubredditInput = z.infer<typeof subredditSchema>;
