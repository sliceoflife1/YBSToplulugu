"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Send, Reply, Clock } from "lucide-react";
import { type ProjectCommentInput } from "@/lib/validations/profile";
import { createProjectComment } from "@/app/projects/actions";
import RichTextEditor from "@/components/community/RichTextEditor";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface ProjectComment {
  id: string;
  project_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles: Profile;
}

interface ProjectCommentSectionProps {
  projectId: string;
  initialComments: ProjectComment[];
  isLoggedIn: boolean;
  currentUser?: { id: string } | null;
}

interface CommentNodeProps {
  comment: ProjectComment;
  depth: number;
  repliesMap: Record<string, ProjectComment[]>;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  isLoggedIn: boolean;
  replyEditorContent: string;
  setReplyEditorContent: (content: string) => void;
  onAddReply: (e: React.FormEvent) => void;
  loadingId: string | null;
  timeAgo: (date: string) => string;
}

// Recursive Comment Node Component defined outside the parent to prevent loop remounting
const CommentNode = ({
  comment,
  depth = 0,
  repliesMap,
  replyingToId,
  setReplyingToId,
  isLoggedIn,
  replyEditorContent,
  setReplyEditorContent,
  onAddReply,
  loadingId,
  timeAgo,
}: CommentNodeProps) => {
  const commentReplies = repliesMap[comment.id] || [];
  const isReplying = replyingToId === comment.id;

  return (
    <div className="group/node mt-4 animate-fade-in">
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

          {/* Content (HTML) */}
          <div 
            className="mt-1.5 text-sm text-[var(--color-foreground)] leading-relaxed prose prose-sm dark:prose-invert max-w-none break-words"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          {/* Actions */}
          {isLoggedIn && (
            <div className="mt-2.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setReplyingToId(isReplying ? null : comment.id);
                  setReplyEditorContent("");
                }}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-indigo-500 transition-colors font-medium"
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
          <form onSubmit={onAddReply}>
            <div className="w-full">
              <RichTextEditor
                content={replyEditorContent}
                onChange={setReplyEditorContent}
                minHeight="min-h-[80px]"
              />
            </div>
            <div className="mt-2.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyingToId(null)}
                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loadingId === comment.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50"
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
            <CommentNode 
              key={reply.id} 
              comment={reply} 
              depth={depth + 1}
              repliesMap={repliesMap}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              isLoggedIn={isLoggedIn}
              replyEditorContent={replyEditorContent}
              setReplyEditorContent={setReplyEditorContent}
              onAddReply={onAddReply}
              loadingId={loadingId}
              timeAgo={timeAgo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Comment Section Component for Projects
export default function ProjectCommentSection({
  projectId,
  initialComments,
  isLoggedIn,
}: ProjectCommentSectionProps) {
  const [comments] = useState<ProjectComment[]>(initialComments);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const [rootEditorContent, setRootEditorContent] = useState("");
  const [replyEditorContent, setReplyEditorContent] = useState("");

  const onAddRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Yorum yazmak için giriş yapmalısınız.");
      return;
    }

    const cleanText = rootEditorContent.replace(/<[^>]*>/g, "").trim();
    if (!cleanText) {
      toast.error("Yorum içeriği boş olamaz.");
      return;
    }

    if (rootEditorContent.length > 2000) {
      toast.error("Yorum en fazla 2000 karakter olabilir.");
      return;
    }

    setLoadingId("root");

    const input: ProjectCommentInput = {
      content: rootEditorContent,
      projectId: projectId,
    };

    const result = await createProjectComment(input);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Yorumunuz başarıyla eklendi!");
      setRootEditorContent("");
      window.location.reload();
    }
    setLoadingId(null);
  };

  const onAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !replyingToId) return;

    const cleanText = replyEditorContent.replace(/<[^>]*>/g, "").trim();
    if (!cleanText) {
      toast.error("Yanıt içeriği boş olamaz.");
      return;
    }

    if (replyEditorContent.length > 2000) {
      toast.error("Yanıt en fazla 2000 karakter olabilir.");
      return;
    }

    setLoadingId(replyingToId);

    const input: ProjectCommentInput = {
      content: replyEditorContent,
      projectId: projectId,
      parentId: replyingToId,
    };

    const result = await createProjectComment(input);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Yanıtınız başarıyla eklendi!");
      setReplyEditorContent("");
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

  const rootComments = comments.filter((c) => !c.parent_id);
  const repliesMap = comments.reduce((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {} as Record<string, ProjectComment[]>);

  return (
    <div id="comments" className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
      <h2 className="flex items-center gap-2 border-b border-[var(--color-border)] pb-4 text-lg font-bold text-[var(--color-foreground)]">
        <MessageSquare className="h-5 w-5 text-indigo-500" />
        Yorumlar ({comments.length})
      </h2>

      {/* Write root comment */}
      {isLoggedIn ? (
        <form onSubmit={onAddRootComment} className="mt-5">
          <div className="space-y-3">
            <RichTextEditor
              content={rootEditorContent}
              onChange={setRootEditorContent}
              minHeight="min-h-[100px]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loadingId === "root"}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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
            <a href="/login" className="font-semibold text-indigo-500 hover:underline">
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
            <CommentNode 
              key={comment.id} 
              comment={comment} 
              depth={0}
              repliesMap={repliesMap}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              isLoggedIn={isLoggedIn}
              replyEditorContent={replyEditorContent}
              setReplyEditorContent={setReplyEditorContent}
              onAddReply={onAddReply}
              loadingId={loadingId}
              timeAgo={timeAgo}
            />
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
