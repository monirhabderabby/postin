"use client";

import { ReactionImage } from "@/components/shared/reactions/reaction-image";
import { useReactToPost } from "@/hooks/features/groups/posts/api/use-react-to-post";
import { resolveReaction } from "@/lib/reactions";
import { cn } from "@/lib/utils";
import { Post } from "@/types/features/posts";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, ThumbsUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { RiShareForwardLine } from "react-icons/ri";
import OverlappingReactions from "./common/overlaping-reactions";
const SharePostModal = dynamic(
  () => import("./comment-dialog/share-post-modal"),
  {
    ssr: false,
  },
);

// ─── Reaction definitions ─────────────────────────────────────────────────────

export const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like", color: "#1877f2" },
  { type: "love", emoji: "❤️", label: "Love", color: "#f33e58" },
  { type: "haha", emoji: "😆", label: "Haha", color: "#f7b928" },
  { type: "wow", emoji: "😮", label: "Wow", color: "#f7b928" },
  { type: "sad", emoji: "😢", label: "Sad", color: "#f7b928" },
  { type: "angry", emoji: "😡", label: "Angry", color: "#e9710f" },
  { type: "care", emoji: "🥰", label: "Care", color: "#f7b928" },
] as const;

export type ReactionType = (typeof REACTIONS)[number]["type"];

// ─── Props ────────────────────────────────────────────────────────────────────

interface PostActionsProps {
  post: Post;
  accessToken: string;
  onCommentClick?: () => void;
  loggedInUserId: string;
  groupId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PostActions = ({
  post,
  accessToken,
  onCommentClick,
  loggedInUserId,
  groupId = "",
}: PostActionsProps) => {
  const { reactionCount, commentCount, shareCount, _id: postId } = post;
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [hovering, setHovering] = useState(false);
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(
    post.reactions.find((item) => item.user._id === loggedInUserId)?.type ??
      null,
  );
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(
    null,
  );
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: react, isPending } = useReactToPost({
    postId,
    groupId,
    accessToken,
    loggedInUserId,
  });

  // ── Hover with delay so accidental mouse-outs don't flicker ───────────────
  const openPicker = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHovering(true);
  };

  const closePicker = () => {
    hoverTimeout.current = setTimeout(() => setHovering(false), 300);
  };

  const handleReact = (type: ReactionType) => {
    const next = activeReaction === type ? null : type; // toggle off same
    setActiveReaction(next);
    setHovering(false);
    react({ type });
  };

  // Click toggles the current reaction (defaults to "like"). The reaction
  // picker overlay still appears on hover, but clicking the main button
  // always fires — hovering shouldn't suppress the tap.
  const handleLikeClick = () => {
    handleReact(activeReaction ?? "like");
  };

  const currentReaction = REACTIONS.find((r) => r.type === activeReaction);

  return (
    <>
      {/* ── Counts row ──────────────────────────────────────────────────────── */}
      {(reactionCount > 0 || commentCount > 0 || shareCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-fb-divider">
          {reactionCount > 0 && (
            <OverlappingReactions
              maxDisplay={post.reactionCount}
              reactions={post.reactions}
              loggedInUserId={loggedInUserId}
            />
          )}
          <div className="flex items-center gap-3 ml-auto">
            {commentCount > 0 && (
              <button
                onClick={onCommentClick}
                className="text-[14px] text-fb-text-secondary hover:underline"
              >
                {commentCount.toLocaleString()} comments
              </button>
            )}
            {shareCount > 0 && (
              <span className="text-[14px] text-fb-text-secondary hover:underline cursor-pointer">
                {shareCount.toLocaleString()} shares
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Action buttons ────────────────────────────────────────────────────── */}
      <div className="flex items-center mx-4">
        <div
          className="flex-1 relative"
          onMouseEnter={openPicker}
          onMouseLeave={closePicker}
        >
          {/* Reaction picker */}
          <AnimatePresence>
            {hovering && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                onMouseEnter={openPicker}
                onMouseLeave={closePicker}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-gray-100 px-2.5 py-2 flex items-end gap-1 z-50"
              >
                {REACTIONS.map((reaction) => (
                  <div
                    key={reaction.type}
                    className="relative flex flex-col items-center"
                  >
                    {/* Label */}
                    <AnimatePresence>
                      {hoveredReaction === reaction.type && (
                        <motion.span
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 2 }}
                          transition={{ duration: 0.1 }}
                          className="absolute -top-8 bg-gray-900 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none"
                        >
                          {reaction.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.12, ease: "easeOut" }}
                      onClick={() => handleReact(reaction.type)}
                      onHoverStart={() => setHoveredReaction(reaction.type)}
                      onHoverEnd={() => setHoveredReaction(null)}
                      className={cn(
                        "select-none focus:outline-none relative",
                        activeReaction === reaction.type &&
                          "drop-shadow-[0_0_4px_rgba(24,119,242,0.6)]",
                      )}
                      aria-label={reaction.label}
                    >
                      <ReactionImage
                        reaction={resolveReaction(reaction.type)}
                        animated={hoveredReaction === reaction.type}
                        size={32}
                      />
                    </motion.button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Like / Active reaction button */}
          <button
            onClick={handleLikeClick}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-0 rounded-md hover:bg-fb-hover transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              {activeReaction && currentReaction ? (
                <motion.span
                  key={activeReaction}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex items-center gap-2 hover:bg-gray-100 w-full justify-center p-1 rounded-[3px] cursor-pointer"
                >
                  <ReactionImage
                    reaction={resolveReaction(currentReaction.type)}
                    size={20}
                  />
                  <span
                    className="text-[15px] font-semibold capitalize"
                    style={{ color: currentReaction.color }}
                  >
                    {currentReaction.label}
                  </span>
                </motion.span>
              ) : (
                <motion.span
                  key="like-default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex items-center gap-2 hover:bg-gray-100 w-full justify-center p-1 rounded-[3px] cursor-pointer"
                >
                  <ThumbsUp className="w-4 h-4 text-secondary-foreground" />
                  <span className="text-[12px] font-semibold text-secondary-foreground">
                    Like
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Comment */}
        <button
          onClick={onCommentClick}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md hover:bg-fb-hover transition-colors"
        >
          <MessageCircle className="w-4 h- text-secondary-foreground" />
          <span className="text-[12px] font-semibold text-secondary-foreground">
            Comment
          </span>
        </button>

        {/* Share */}
        <button
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md hover:bg-fb-hover transition-colors"
          onClick={() => setShareModalOpen(true)}
        >
          <RiShareForwardLine className="w-5 h-5 text-secondary-foreground" />
          <span className="text-[12px] font-semibold text-secondary-foreground">
            Share
          </span>
        </button>
      </div>

      <SharePostModal
        post={post}
        accessToken={accessToken}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        loggedInUserId={loggedInUserId}
      />
    </>
  );
};
