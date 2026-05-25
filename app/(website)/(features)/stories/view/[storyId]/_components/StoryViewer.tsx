"use client";

import { ReactionImage } from "@/components/shared/reactions/reaction-image";
import { resolveReaction } from "@/lib/reactions";
import { Story, StoryUser } from "@/types/features/feed/story";
import {
  BellOff,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Flag,
  MoreHorizontal,
  Pause,
  Play,
  Send,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useReactToStory } from "@/hooks/features/feed/story/use-react-to-story";
import { useTrackStoryView } from "@/hooks/features/feed/story/use-track-story-view";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { StoryProgressBar } from "./StoryProgressBar";

const STORY_DURATION = 15000; // 15 seconds
const TICK_INTERVAL = 100; // ms per tick

const REACTIONS = [
  { emoji: "👍", type: "like" as const },
  { emoji: "❤️", type: "love" as const },
  { emoji: "😮", type: "wow" as const },
  { emoji: "😂", type: "haha" as const },
  { emoji: "😢", type: "sad" as const },
  { emoji: "😡", type: "angry" as const },
  { emoji: "\uD83E\uDD70", type: "care" as const },
];

// add this just above the component or alongside the other helpers
export function getMyReaction(
  story: Story,
  currentUserId: string,
): string | null {
  const found = story.reactions.find((r) => r.user === currentUserId);
  if (!found) return null;
  return REACTIONS.find((r) => r.type === found.type)?.emoji ?? null;
}

interface Props {
  stories: Story[];
  user: StoryUser;
  initialStoryId?: string;
  accessToken: string;
  currentUserId: string;
  onPrevGroup: () => void;
  onNextGroup: () => void;
  hasPrevGroup: boolean;
  hasNextGroup: boolean;
}

export function getStoryUserDisplayName(user: StoryUser): string {
  if (user.firstName || user.lastName) {
    return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }
  return user.firstName ?? user.username ?? "Unknown";
}

export function getStoryUserAvatar(user: StoryUser): string | undefined {
  return user.profileImage.url ?? user.profileImage.url;
}

export function StoryViewer({
  stories,
  user,
  initialStoryId,
  accessToken,
  currentUserId,
  onPrevGroup,
  onNextGroup,
  hasPrevGroup,
  hasNextGroup,
}: Props) {
  const router = useRouter();

  const initialIndex = Math.max(
    0,
    stories.findIndex((s) => s._id === initialStoryId),
  );

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [sentReaction, setSentReaction] = useState<string | null>(() =>
    getMyReaction(stories[initialIndex], currentUserId),
  );
  const menuRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // progressRef stores the real progress value.
  // The interval reads/writes this ref directly so we never need to
  // re-create the interval when progress updates — avoiding resets.
  const progressRef = useRef(0);

  // isPausedRef mirrors isPaused state so the interval closure can read
  // the latest value without being recreated on every pause toggle.
  const isPausedRef = useRef(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const trackedRef = useRef<Set<string>>(new Set());

  const { mutate: trackView } = useTrackStoryView({ accessToken });
  const { mutate: reactToStory } = useReactToStory({ accessToken });

  const currentStory = stories[currentIndex];

  // Keep isPausedRef always in sync — this is the ONLY place isPaused
  // touches the interval logic, so the interval itself never needs to restart.
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  // Pause the timer while the menu is open so the story doesn't advance
  // while the user is interacting with menu actions.
  useEffect(() => {
    if (showMenu) setIsPaused(true);
  }, [showMenu]);

  // Sync mute state with the underlying <video> element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Sync pause state with the underlying <video> element so the video
  // actually stops playing — not just the progress bar timer.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPaused) {
      video.pause();
    } else {
      void video.play().catch(() => {
        /* play() can reject if interrupted by a fast pause toggle — safe to ignore */
      });
    }
  }, [isPaused]);

  // Track view once per story
  useEffect(() => {
    if (!currentStory) return;
    if (trackedRef.current.has(currentStory._id)) return;
    trackedRef.current.add(currentStory._id);
    trackView(currentStory._id);
  }, [currentStory?._id, currentStory, trackView]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < stories.length - 1) {
        progressRef.current = 0;
        setProgress(0);
        return prev + 1;
      }
      onNextGroup();
      return prev;
    });
  }, [stories.length, onNextGroup]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        progressRef.current = 0;
        setProgress(0);
        return prev - 1;
      }
      onPrevGroup();
      return prev;
    });
  }, [onPrevGroup]);

  // ─── THE FIX ───────────────────────────────────────────────────────────────
  // One interval per story. It only restarts when `currentIndex` changes —
  // NOT when `isPaused` changes. On every tick it checks `isPausedRef.current`
  // and simply skips the tick if paused, leaving `progressRef.current` frozen.
  // When unpaused, ticks resume from exactly where they stopped.
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Reset when story changes
    progressRef.current = 0;
    setProgress(0);
    setSentReaction(getMyReaction(stories[currentIndex], currentUserId)); // ← replace the null reset
    setShowReactions(false);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      // Skip tick entirely when paused — progress stays frozen
      if (isPausedRef.current) return;

      progressRef.current += (TICK_INTERVAL / STORY_DURATION) * 100;

      if (progressRef.current >= 100) {
        progressRef.current = 100;
        setProgress(100);
        clearInterval(timerRef.current!);
        goNext();
        return;
      }

      setProgress(progressRef.current);
    }, TICK_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]); // ← intentionally excludes isPaused and goNext

  const handleReact = (type: (typeof REACTIONS)[0]["type"]) => {
    reactToStory(
      { storyId: currentStory._id, type },
      {
        onSuccess: () => {
          const emoji = REACTIONS.find((r) => r.type === type)?.emoji ?? "";
          setSentReaction(emoji); // ← stays selected, no setTimeout to clear it
          setShowReactions(false);
        },
      },
    );
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    setReplyText("");
  };

  const bgStyle = currentStory?.backgroundColor
    ? { backgroundColor: currentStory.backgroundColor }
    : { backgroundColor: "#111827" };

  const avatar = getStoryUserAvatar(user);

  const displayName = getStoryUserDisplayName(user);

  const hasVideo = currentStory?.media?.[0]?.type === "video";
  const isOwnStory = user._id === currentUserId;

  return (
    <div className="flex items-center justify-center w-full h-full relative select-none">
      {/* Prev group arrow */}
      {hasPrevGroup && (
        <button
          onClick={onPrevGroup}
          className="absolute left-6 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
      )}

      {/* Story card */}
      <div
        className="relative w-85 h-151 rounded-2xl overflow-hidden shadow-2xl"
        style={bgStyle}
      >
        {/* Media — image */}
        {currentStory?.media &&
          currentStory.media.length > 0 &&
          currentStory.media[0].type !== "video" && (
            <Image
              src={currentStory.media[0].url}
              alt="story"
              fill
              className="object-cover"
              draggable={false}
              priority
            />
          )}

        {/* Media — video */}
        {currentStory?.media &&
          currentStory.media.length > 0 &&
          currentStory.media[0].type === "video" && (
            <video
              ref={videoRef}
              key={currentStory._id}
              src={currentStory.media[0].url}
              poster={currentStory.media[0].thumbnail}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              playsInline
              muted={isMuted}
            />
          )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 pt-2">
          <StoryProgressBar
            count={stories.length}
            currentIndex={currentIndex}
            progress={progress}
          />
        </div>

        {/* Header */}
        <div className="absolute top-7 left-0 right-0 z-10 flex items-center gap-2 px-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shrink-0">
            {avatar ? (
              <Image
                src={avatar}
                alt={displayName}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#1877f2] flex items-center justify-center text-white text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-semibold leading-tight drop-shadow">
              {displayName}
            </p>
            <p className="text-white/70 text-[11px]">
              {currentStory
                ? formatDistanceToNow(new Date(currentStory.createdAt), {
                    addSuffix: true,
                  })
                : ""}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {hasVideo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((m) => !m);
                }}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {isMuted ? (
                  <VolumeX size={16} className="text-white" />
                ) : (
                  <Volume2 size={16} className="text-white" />
                )}
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused((p) => !p); // ← this is the only toggle
              }}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              {isPaused ? (
                <Play size={16} className="text-white" />
              ) : (
                <Pause size={16} className="text-white" />
              )}
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((s) => !s);
                }}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <MoreHorizontal size={16} className="text-white" />
              </button>

              {showMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-[#242526] shadow-2xl ring-1 ring-white/10 overflow-hidden z-30"
                >
                  {isOwnStory ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        // TODO: wire up delete-story mutation when available
                        console.log("Delete story", currentStory?._id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] text-red-400 hover:bg-white/5 transition-colors"
                    >
                      <Trash2 size={15} />
                      Delete story
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          console.log("Hide story", currentStory?._id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] text-white hover:bg-white/5 transition-colors"
                      >
                        <EyeOff size={15} />
                        Hide story
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          console.log("Mute story author", user._id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] text-white hover:bg-white/5 transition-colors"
                      >
                        <BellOff size={15} />
                        Mute story author
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          console.log("Report story", currentStory?._id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] text-white hover:bg-white/5 transition-colors"
                      >
                        <Flag size={15} />
                        Report story
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push("/");
              }}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Centered text */}
        {currentStory?.text && (
          <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none z-5">
            <p
              className="text-center text-[22px] font-bold leading-snug wrap-break-words drop-shadow-lg"
              style={{
                color:
                  currentStory.backgroundColor === "#ffffff"
                    ? "#050505"
                    : "#ffffff",
              }}
            >
              {currentStory.text}
            </p>
          </div>
        )}

        {/* Tap zones */}
        <div className="absolute inset-0 flex z-6">
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          />
          <div
            className="w-2/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          />
        </div>

        {/* Floating reaction */}
        {/* {showReactions && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <span className="text-6xl animate-bounce">{sentReaction}</span>
          </div>
        )} */}

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-4">
          {showReactions && (
            <div className="flex justify-center gap-2 mb-3">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReact(r.type);
                  }}
                  onMouseEnter={() => setHoveredReaction(r.type)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:scale-125 transition-transform"
                >
                  <ReactionImage
                    reaction={resolveReaction(r.type)}
                    animated={hoveredReaction === r.type}
                    size={30}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white/10 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                placeholder="Send message..."
                className="flex-1 bg-transparent text-white placeholder-white/60 text-[13px] focus:outline-none"
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                onClick={(e) => e.stopPropagation()}
              />
              {replyText && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendReply();
                  }}
                >
                  <Send size={14} className="text-white ml-2" />
                </button>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReactions((s) => !s);
              }}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center text-lg hover:bg-white/20 transition-colors"
            >
              {sentReaction ? (
                <ReactionImage
                  reaction={resolveReaction(sentReaction)}
                  size={24}
                />
              ) : (
                "😊"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Next group arrow */}
      {hasNextGroup && (
        <button
          onClick={onNextGroup}
          className="absolute right-6 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-colors"
        >
          <ChevronRight size={22} className="text-white" />
        </button>
      )}
    </div>
  );
}
