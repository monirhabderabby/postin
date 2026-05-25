"use client";

import { ReactionImage } from "@/components/shared/reactions/reaction-image";
import { useSaveReel } from "@/hooks/features/reels/use-save-reel";
import { REACTIONS, ReactionType, resolveReaction } from "@/lib/reactions";
import { cn } from "@/lib/utils";
import { Reel } from "@/types/features/reels";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, MessageCircle, ThumbsUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { RiShareForwardLine } from "react-icons/ri";

const SharePostModal = dynamic(
  () =>
    import(
      "@/components/shared/features/posts/comment-dialog/share-post-modal"
    ),
  { ssr: false },
);

interface ReelActionsProps {
  reel: Reel;
  accessToken: string;
  loggedInUserId: string;
  activeReaction: ReactionType | null;
  isReacting: boolean;
  onReact: (type: ReactionType) => void;
  onCommentClick: () => void;
}

const compactNumber = (n: number) => {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
};

export const ReelActions = ({
  reel,
  accessToken,
  loggedInUserId,
  activeReaction,
  isReacting,
  onReact,
  onCommentClick,
}: ReelActionsProps) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(
    null,
  );
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: save, isPending: isSaving } = useSaveReel({
    reelId: reel._id,
    accessToken,
  });

  const handleLikeTap = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setShowPicker(false);
    onReact("like");
  };

  const handlePicker = (type: ReactionType) => {
    setShowPicker(false);
    onReact(type);
  };

  // Delay opening the picker so a quick click still registers as "like"
  const openPicker = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setShowPicker(true), 450);
  };
  const closePicker = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setShowPicker(false), 250);
  };

  const currentReaction = REACTIONS.find((r) => r.type === activeReaction);

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        {/* Reaction button */}
        <div
          className="relative flex flex-col items-center"
          onMouseEnter={openPicker}
          onMouseLeave={closePicker}
        >
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 30 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                onMouseEnter={openPicker}
                onMouseLeave={closePicker}
                className="absolute right-12 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.25)] border border-gray-100 px-2 py-1.5 flex items-center gap-1 z-40"
              >
                {REACTIONS.map((r, i) => (
                  <motion.button
                    key={r.type}
                    type="button"
                    initial={{ scale: 0, opacity: 0, y: 6 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.03,
                      type: "spring",
                      stiffness: 500,
                      damping: 22,
                    }}
                    whileHover={{ scale: 1.35, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredReaction(r.type)}
                    onHoverEnd={() => setHoveredReaction(null)}
                    onClick={() => handlePicker(r.type)}
                    className={cn(
                      "select-none focus:outline-none",
                      activeReaction === r.type &&
                        "drop-shadow-[0_0_6px_rgba(24,119,242,0.8)]",
                    )}
                    aria-label={r.label}
                  >
                    <ReactionImage
                      reaction={resolveReaction(r.type)}
                      animated={hoveredReaction === r.type}
                      size={32}
                    />
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleLikeTap}
            disabled={isReacting}
            aria-label="Like"
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center cursor-pointer",
              "bg-black/45 backdrop-blur-sm text-white",
              "hover:bg-black/65 transition-colors disabled:opacity-60",
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {activeReaction && currentReaction ? (
                <motion.span
                  key={activeReaction}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                >
                  <ReactionImage
                    reaction={resolveReaction(currentReaction.type)}
                    size={24}
                  />
                </motion.span>
              ) : (
                <motion.span
                  key="like"
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.4 }}
                >
                  <ThumbsUp className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <span className="text-[11px] font-semibold text-white mt-0.5 drop-shadow">
            {compactNumber(reel.reactionCount || 0)}
          </span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={onCommentClick}
            aria-label="Comments"
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center cursor-pointer",
              "bg-black/45 backdrop-blur-sm text-white",
              "hover:bg-black/65 transition-colors",
            )}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-semibold text-white mt-0.5 drop-shadow">
            {compactNumber(reel.commentCount || 0)}
          </span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share"
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center cursor-pointer",
              "bg-black/45 backdrop-blur-sm text-white",
              "hover:bg-black/65 transition-colors",
            )}
          >
            <RiShareForwardLine className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-semibold text-white mt-0.5 drop-shadow">
            {compactNumber(reel.shareCount || 0)}
          </span>
        </div>

        {/* Save */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => save()}
            disabled={isSaving}
            aria-label={reel.isSaved ? "Unsave" : "Save"}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center cursor-pointer",
              "bg-black/45 backdrop-blur-sm text-white",
              "hover:bg-black/65 transition-colors disabled:opacity-60",
            )}
          >
            <Bookmark
              className={cn(
                "w-5 h-5",
                reel.isSaved && "fill-white text-white",
              )}
            />
          </button>
          <span className="text-[11px] font-semibold text-white mt-0.5 drop-shadow">
            {compactNumber(reel.saveCount || 0)}
          </span>
        </div>
      </div>

      <SharePostModal
        post={reel}
        accessToken={accessToken}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        loggedInUserId={loggedInUserId}
      />
    </>
  );
};
