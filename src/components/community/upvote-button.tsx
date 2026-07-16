"use client";

import { useState } from "react";
import { ArrowBigUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface UpvoteButtonProps {
  postId: string;
  initialCount: number;
  initialUpvoted: boolean;
  isLoggedIn: boolean;
}

export default function UpvoteButton({ postId, initialCount, initialUpvoted, isLoggedIn }: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [loading, setLoading] = useState(false);

  const handleUpvote = async () => {
    if (!isLoggedIn) {
      toast.error("Beğenmek için giriş yapmalısınız");
      return;
    }
    if (loading) return;

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (upvoted) {
      await supabase.from("upvotes").delete().eq("post_id", postId).eq("user_id", user.id);
      setCount((c) => c - 1);
      setUpvoted(false);
    } else {
      await supabase.from("upvotes").insert({ post_id: postId, user_id: user.id });
      setCount((c) => c + 1);
      setUpvoted(true);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleUpvote}
      disabled={loading}
      className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
        upvoted
          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      }`}
    >
      <ArrowBigUp className={`h-5 w-5 ${upvoted ? "fill-current" : ""}`} />
      <span>{count}</span>
    </button>
  );
}
