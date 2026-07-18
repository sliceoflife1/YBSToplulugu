"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MessageSquare, Send, CornerDownRight, Reply, Clock } from "lucide-react";
import { commentSchema, type CommentInput } from "@/lib/validations/community";
import { createComment } from "@/app/community/actions";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles: Profile;
}

interface CommentSectionProps {
  postId: string;
  slug: string;
  initialComments: Comment[];
  isLoggedIn: boolean;
  currentUser: { id: string } | null;
}

export default function CommentSection({
  postId,
  slug,
  initialComments,
  isLoggedIn,
  currentUser,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  // Root comment form
  const {
    register: registerRoot,
    handleSubmit: handleSubmitRoot,
    reset: resetRoot,
    formState: { errors: errorsRoot, isValid: isValidRoot },
  } = useForm<{ content: string }>({
    defaultValues: { content: "" },
  });

  // Reply comment form
  const {
    register: registerReply,
    handleSubmit: handleSubmitReply,
    reset: resetReply,
    formState: { errors: errorsReply, isValid: isValidReply },
  } = useForm<{ content: string }>({
    defaultValues: { content: "" },
  });

  const onAddRootComment = async (data: { content: string }) => {
    if (!isLoggedIn) {
      toast.error("Yorum yazmak için giriş yapmalısınız.");
      return;
    }
    setLoadingId("root");

    const input: CommentInput = {
      content: data.content,
      postId: postId,
    };

    const result = await createComment(input, slug);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Yorumunuz başarıyla eklendi!");
      resetRoot();
      // Safe reload or append would be nice, but since it's a server action, router.refresh is best.
      // However, we can also refresh page content. Let's trigger window reload or dynamic refresh.
      window.location.reload();
    }
    setLoadingId(null);
  };

  const onAddReply = async (data: { content: string }) => {
    if (!isLoggedIn || !replyingToId) return;
    setLoadingId(replyingToId);

    const input: CommentInput = {
      content: data.content,
      postId: postId,
      parentId: replyingToId,
    };

    const result = await createComment(input, slug);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Yanıtınız başarıyla eklendi!");
      resetReply();
      setReplyingToId(null);
      window.location.reload();
    }
    setLoadingId(null);
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "az önce";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}dk`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}sa`;
    return `${Math.floor(seconds / 86400)}g`;
  };

  // Build comments tree
  const rootComments = comments.filter((c) => !c.parent_id);
  const repliesMap = comments.reduce((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  // Recursive Comment Node Component
  const CommentNode = ({ comment, depth = 0 }: { comment: Comment; depth: number }) => {
    const commentReplies = repliesMap[comment.id] || [];
    const isReplying = replyingToId === comment.id;

    return (
      <div className="group/node mt-4">
        {/* Comment Card */}
        <div className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm transition-all hover:shadow-md">
          {/* Avatar / Initials */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-semibold text-[var(--color-primary)]">
            {comment.profiles?.avatar_url ? (
              <img
                src={comment.profiles.avatar_url}
                alt={`${comment.profiles.first_name} ${comment.profiles.last_name}`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              `${comment.profiles?.first_name?.charAt(0).toUpperCase()}${comment.profiles?.last_name?.charAt(0).toUpperCase()}`
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header info */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-[var(--color-foreground)]">
                {comment.profiles?.first_name} {comment.profiles?.last_name}
              </span>
              <span className="text-[var(--color-muted-foreground)]">•</span>
              <span className="flex items-center gap-1 text-[var(--color-muted-foreground)]">
                <Clock className="h-3 w-3" /> {timeAgo(comment.created_at)}
              </span>
            </div>

            {/* Content */}
            <p className="mt-1.5 text-sm text-[var(--color-foreground)] leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>

            {/* Actions */}
            {isLoggedIn && (
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToId(isReplying ? null : comment.id);
                    resetReply();
                  }}
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Cevapla
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Inline Reply Form */}
        {isReplying && (
          <div className="ml-6 mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 animate-slide-down">
            <form onSubmit={handleSubmitReply(onAddReply)}>
              <div className="flex gap-2">
                <textarea
                  {...registerReply("content", { required: true })}
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
                  placeholder={`${comment.profiles?.first_name} adlı kullanıcıya yanıt yazın...`}
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyingToId(null)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[var(--color-muted)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loadingId === comment.id}
                  className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {loadingId === comment.id ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Gönder
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Nested Replies */}
        {commentReplies.length > 0 && (
          <div className="ml-4 border-l-2 border-[var(--color-border)] pl-4">
            {commentReplies.map((reply) => (
              <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
      <h2 className="flex items-center gap-2 border-b border-[var(--color-border)] pb-4 text-lg font-bold text-[var(--color-foreground)]">
        <MessageSquare className="h-5 w-5 text-[var(--color-primary)]" />
        Yorumlar ({comments.length})
      </h2>

      {/* Write root comment */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmitRoot(onAddRootComment)} className="mt-5">
          <div className="relative">
            <textarea
              {...registerRoot("content", { required: true })}
              rows={3}
              className="w-full resize-none rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
              placeholder="Düşüncelerinizi paylaşın, tartışmaya katılın..."
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={loadingId === "root"}
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loadingId === "root" ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Paylaş
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-xl bg-[var(--color-muted)]/50 p-4 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Yorum yazabilmek için lütfen{" "}
            <a href="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
              giriş yapın
            </a>
            .
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="mt-6 divide-y divide-[var(--color-border)]/50">
        {rootComments.length > 0 ? (
          rootComments.map((comment) => (
            <CommentNode key={comment.id} comment={comment} depth={0} />
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--color-muted-foreground)] italic">
              Henüz yorum yapılmamış. İlk yorumu siz yazın!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
