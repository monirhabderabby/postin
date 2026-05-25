"use client";

import { PostCommentDialog } from "@/components/shared/features/posts/comment-dialog/post-comment-dialog";
import { useReactToReel } from "@/hooks/features/reels/use-react-to-reel";
import { ReactionType } from "@/lib/reactions";
import { Reel } from "@/types/features/reels";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReelActions } from "./reel-actions";
import { ReelInfo } from "./reel-info";
import { ReelPlayer } from "./reel-player";

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  accessToken: string;
  loggedInUserId: string;
}

export const ReelItem = ({
  reel,
  isActive,
  muted,
  onToggleMute,
  accessToken,
  loggedInUserId,
}: ReelItemProps) => {
  const [commentOpen, setCommentOpen] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const heartTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialReaction = useMemo<ReactionType | null>(
    () =>
      reel.reactions?.find((r) => r.user?._id === loggedInUserId)?.type ??
      null,
    [reel.reactions, loggedInUserId],
  );

  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(
    initialReaction,
  );

  // Keep state in sync when reel data updates (e.g. cache update from server)
  useEffect(() => {
    setActiveReaction(initialReaction);
  }, [initialReaction]);

  const { mutate: react, isPending: isReacting } = useReactToReel({
    reelId: reel._id,
    accessToken,
  });

  const handleReact = (type: ReactionType) => {
    const next = activeReaction === type ? null : type;
    setActiveReaction(next);
    react({ type });
  };

  const handleDoubleTap = () => {
    if (!activeReaction) {
      handleReact("love");
    }
    setShowHeart(true);
    if (heartTimeout.current) clearTimeout(heartTimeout.current);
    heartTimeout.current = setTimeout(() => setShowHeart(false), 700);
  };

  useEffect(() => {
    return () => {
      if (heartTimeout.current) clearTimeout(heartTimeout.current);
    };
  }, []);

  const videoSrc = reel.videos?.[0]?.url || reel.video?.url || "";
  const poster =
    reel.videos?.[0]?.thumbnail ||
    reel.video?.thumbnail ||
    reel.images?.[0]?.url ||
    "";

  if (!videoSrc) {
    return (
      <div className="relative w-full h-full bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Video unavailable</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-full bg-black overflow-hidden">
        <ReelPlayer
          src={videoSrc}
          poster={poster}
          isActive={isActive}
          muted={muted}
          onToggleMute={onToggleMute}
          onDoubleTap={handleDoubleTap}
        />

        {/* Bottom gradient for caption readability */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none z-10" />

        {/* Info: bottom-left */}
        <div className="absolute left-3 right-20 bottom-8 z-20 pointer-events-auto">
          <ReelInfo reel={reel} />
        </div>

        {/* Actions: bottom-right */}
        <div className="absolute right-2 bottom-8 z-20 pointer-events-auto">
          <ReelActions
            reel={reel}
            accessToken={accessToken}
            loggedInUserId={loggedInUserId}
            activeReaction={activeReaction}
            isReacting={isReacting}
            onReact={handleReact}
            onCommentClick={() => setCommentOpen(true)}
          />
        </div>

        {/* Double-tap heart burst */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              key="dt-heart"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            >
              <Heart
                className="w-28 h-28 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.45)]"
                fill="#ef4444"
                strokeWidth={1.5}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {commentOpen && (
          <PostCommentDialog
            post={reel}
            accessToken={accessToken}
            loggedInUserId={loggedInUserId}
            groupId=""
            onClose={() => setCommentOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
