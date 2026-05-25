"use client";

import { ReactionImage } from "@/components/shared/reactions/reaction-image";
import { useReactToComment } from "@/hooks/features/groups/posts/comment/use-react-to-comment";
import { ReactionType, resolveReaction } from "@/lib/reactions";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { REACTION_META, ReactionMeta } from "./types";

interface CommentLikeButtonProps {
  commentId: string;
  postId: string;
  accessToken: string;
  count: number;
  initialReaction?: ReactionType | null;
}

export function CommentLikeButton({
  commentId,
  postId,
  accessToken,
  count,
  initialReaction = null,
}: CommentLikeButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: reactToComment, isPending } = useReactToComment({
    postId,
    accessToken,
  });

  const active = initialReaction
    ? (REACTION_META.find((r) => r.type === initialReaction) ?? null)
    : null;
  const liked = active !== null;

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowPicker(true);
  };
  const close = () => {
    timerRef.current = setTimeout(() => setShowPicker(false), 280);
  };

  const pick = (r: ReactionMeta) => {
    setShowPicker(false);
    reactToComment({ commentId, type: r.type as ReactionType });
  };

  const toggle = () => {
    const type = liked ? (active!.type as ReactionType) : "like";
    reactToComment({ commentId, type });
  };

  return (
    <div
      className="relative inline-flex items-center gap-1"
      onMouseEnter={open}
      onMouseLeave={close}
    >
      {/* Reaction picker popover */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 6 }}
            transition={{ type: "spring", stiffness: 440, damping: 26 }}
            onMouseEnter={open}
            onMouseLeave={close}
            className="absolute bottom-full left-0 mb-1.5 bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-[#e4e6eb] px-2.5 py-1.5 flex gap-1 z-999"
          >
            {REACTION_META.map((r, i) => (
              <motion.button
                key={r.type}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: i * 0.03,
                  type: "spring",
                  stiffness: 500,
                  damping: 22,
                }}
                whileHover={{ scale: 1.5, y: -6 }}
                onClick={() => pick(r)}
                className="bg-transparent border-none cursor-pointer p-0.5"
              >
                <ReactionImage reaction={resolveReaction(r.type)} size={28} />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Like / active reaction button */}
      <button
        onClick={toggle}
        disabled={isPending}
        className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 text-[12px] font-semibold disabled:opacity-60 transition-opacity"
        style={{ color: liked && active ? active.color : "#65676b" }}
      >
        {liked && active && (
          <ReactionImage reaction={resolveReaction(active.type)} size={16} />
        )}
        {liked && active
          ? active.type.charAt(0).toUpperCase() + active.type.slice(1)
          : "Like"}
      </button>

      {/* Count */}
      {count > 0 && <span className="text-[12px] text-[#65676b]">{count}</span>}
    </div>
  );
}
