"use client";

import { useState } from "react";
import { ArrowBigUp } from "lucide-react";
import { toast } from "sonner";
import { upvoteProject } from "@/app/projects/actions";

interface ProjectUpvoteButtonProps {
  projectId: string;
  initialCount: number;
  initialUpvoted: boolean;
  isLoggedIn: boolean;
}

export default function ProjectUpvoteButton({
  projectId,
  initialCount,
  initialUpvoted,
  isLoggedIn,
}: ProjectUpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [loading, setLoading] = useState(false);

  const handleUpvote = async () => {
    if (!isLoggedIn) {
      toast.error("Oy kullanmak için giriş yapmalısınız");
      return;
    }
    if (loading) return;

    setLoading(true);

    // Optimistik durum güncellemesi
    const originalCount = count;
    const originalUpvoted = upvoted;
    setCount((c) => (upvoted ? c - 1 : c + 1));
    setUpvoted(!upvoted);

    const result = await upvoteProject(projectId);
    
    if (result.error) {
      toast.error(result.error);
      // Hata durumunda eski duruma geri dön
      setCount(originalCount);
      setUpvoted(originalUpvoted);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleUpvote}
      disabled={loading}
      className={`flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all duration-200 ${
        upvoted
          ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-transparent"
      }`}
    >
      <ArrowBigUp className={`h-5 w-5 ${upvoted ? "fill-current" : ""}`} />
      <span>{count}</span>
    </button>
  );
}
