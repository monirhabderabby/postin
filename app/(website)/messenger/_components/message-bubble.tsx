"use client";

import { ReactionImage } from "@/components/shared/reactions/reaction-image";
import { resolveReaction } from "@/lib/reactions";
import { cn } from "@/lib/utils";
import type {
  Message,
  MessageSendStatus,
  MessengerUser,
} from "@/types/messenger";
import { format } from "date-fns";
import { FileText, Reply, Smile } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Avatar } from "./avatar";
import {
  displayNameInConversation,
  getUserAvatar,
  userFullName,
} from "./helpers";
import { ImageViewer } from "./image-viewer";
import { useMessageGestures } from "./use-message-gestures";

interface Props {
  message: Message;
  meId: string;
  conversationId: string;
  showAvatar: boolean;
  seenByUsers?: MessengerUser[];
  onContextMenu: (msg: Message, e: React.MouseEvent) => void;
  onReact: (msg: Message) => void;
  onReply: (msg: Message) => void;
}

interface HoverActionsProps {
  isMine: boolean;
  onReact: () => void;
  onReply: () => void;
}

export const MESSAGE_STATUS_ICONS: Record<
  MessageSendStatus,
  { src: string; label: string }
> = {
  waiting: {
    src: "/features/message/waiting%20to%20sent.png",
    label: "Waiting to send",
  },
  sent: {
    src: "/features/message/sent.png",
    label: "Sent",
  },
  delivered: {
    src: "/features/message/delivered.png",
    label: "Delivered",
  },
  failed: {
    src: "/features/message/failed%20to%20sent.png",
    label: "Failed to send",
  },
};

export function MessageStatusIcon({ status }: { status: MessageSendStatus }) {
  const icon = MESSAGE_STATUS_ICONS[status];

  return (
    <Image
      src={icon.src}
      alt={icon.label}
      width={14}
      height={14}
      className="size-3.5"
      title={icon.label}
    />
  );
}

function HoverActions({ isMine, onReact, onReply }: HoverActionsProps) {
  return (
    <div
      className={cn(
        // Use opacity (transitionable) + a delay-out so the bar lingers when
        // the cursor briefly leaves the bubble on its way to the buttons.
        "pointer-events-none absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5 rounded-full border bg-card px-1 py-0.5 opacity-0 shadow-sm transition-opacity delay-150 duration-150",
        "group-hover/msg:pointer-events-auto group-hover/msg:opacity-100 group-hover/msg:delay-0",
        "hover:pointer-events-auto hover:opacity-100 hover:delay-0",
        // Sit flush against the bubble — no margin gap so the cursor never
        // crosses empty space between bubble and buttons.
        isMine ? "right-full" : "left-full",
      )}
    >
      <button
        type="button"
        onClick={onReact}
        className="flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="React"
      >
        <Smile className="size-4" />
      </button>
      <button
        type="button"
        onClick={onReply}
        className="flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Reply"
      >
        <Reply className="size-4" />
      </button>
    </div>
  );
}

interface ActionWrapProps {
  children: React.ReactNode;
  isMine: boolean;
  onReact: () => void;
  onReply: () => void;
}

function ActionWrap({ children, isMine, onReact, onReply }: ActionWrapProps) {
  const { handlers, translateX } = useMessageGestures({
    onLongPress: onReact,
    onSwipeReply: onReply,
  });

  const isSwiping = translateX !== 0;
  // Show a reply hint on the opposite side as the user drags
  const showHint = Math.abs(translateX) > 12;

  return (
    <div className="group/msg relative w-fit max-w-full">
      {showHint && (
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground transition-opacity",
            translateX > 0 ? "-left-7" : "-right-7",
          )}
          style={{ opacity: Math.min(1, Math.abs(translateX) / 60) }}
        >
          <Reply className="size-4" />
        </span>
      )}
      <div
        {...handlers}
        style={{
          transform: `translateX(${translateX}px)`,
          touchAction: "pan-y",
        }}
        className={cn(
          "w-fit max-w-full",
          isSwiping ? "" : "transition-transform duration-150",
        )}
      >
        {children}
      </div>
      <HoverActions isMine={isMine} onReact={onReact} onReply={onReply} />
    </div>
  );
}

export function MessageBubble({
  message,
  meId,
  conversationId,
  showAvatar,
  seenByUsers,
  onContextMenu,
  onReact,
  onReply,
}: Props) {
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const isMine = message.sender?._id === meId;
  const sendStatus: MessageSendStatus | null = isMine
    ? (message.sendStatus ??
      (seenByUsers && seenByUsers.length > 0 ? "delivered" : "sent"))
    : null;
  const time = message.createdAt
    ? format(new Date(message.createdAt), "h:mm a")
    : "";

  const wrap = (node: React.ReactNode) => (
    <ActionWrap
      isMine={isMine}
      onReact={() => onReact(message)}
      onReply={() => onReply(message)}
    >
      {node}
    </ActionWrap>
  );

  return (
    <div
      className={cn(
        "my-0.5 flex items-end gap-2",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      {!isMine && (
        <div
          className={cn(
            "relative size-7 shrink-0 overflow-hidden rounded-full bg-muted",
            !showAvatar && "invisible",
          )}
        >
          <Avatar
            src={getUserAvatar(message.sender)}
            alt={userFullName(message.sender)}
            sizes="28px"
          />
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[68%] flex-col gap-1",
          isMine ? "items-end" : "items-start",
        )}
      >
        {/* Reply preview */}
        {message.replyTo && (
          <>
            <div
              className={cn(
                "flex items-center gap-1 text-[11px] text-muted-foreground",
                isMine ? "self-end" : "self-start",
              )}
            >
              <Reply className="size-3" />
              <span>
                {isMine ? "You replied to " : ""}
                <span className="font-medium">
                  {displayNameInConversation(
                    message.replyTo.sender,
                    conversationId,
                  )}
                </span>
              </span>
            </div>
            {message.replyTo.text && (
              <div
                className={cn(
                  "max-w-full rounded-2xl bg-muted/40 px-3 py-1.5 text-[12px] text-muted-foreground",
                  isMine
                    ? "self-end rounded-br-md"
                    : "self-start rounded-bl-md",
                )}
              >
                {message.replyTo.text}
              </div>
            )}
          </>
        )}

        {/* Image */}
        {message.type === "image" &&
          message.media?.url &&
          wrap(
            <button
              type="button"
              onClick={() => setViewerSrc(message.media!.url!)}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(message, e);
              }}
              className="block cursor-zoom-in overflow-hidden rounded-2xl"
              title="Click to view"
            >
              <Image
                src={message.media.url}
                alt={message.media.fileName || "image"}
                width={320}
                height={320}
                className="max-h-72 w-56 object-cover transition hover:opacity-95"
              />
            </button>,
          )}

        {/* Video */}
        {message.type === "video" &&
          message.media?.url &&
          wrap(
            <video
              controls
              src={message.media.url}
              className="max-h-72 w-72 rounded-2xl"
            />,
          )}

        {/* Audio */}
        {message.type === "audio" &&
          message.media?.url &&
          wrap(
            <audio
              controls
              src={message.media.url}
              className="h-10 w-64"
            />,
          )}

        {/* File */}
        {message.type === "file" &&
          message.media?.url &&
          wrap(
            <a
              href={message.media.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 rounded-2xl px-3 py-2 text-[13px]",
                isMine
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted/70 text-foreground",
              )}
            >
              <FileText className="size-4" />
              <span className="max-w-45 truncate">
                {message.media.fileName || "Attachment"}
              </span>
            </a>,
          )}

        {/* Text bubble */}
        {message.text &&
          wrap(
            <div
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(message, e);
              }}
              title={
                time
                  ? `${time}${message.isEdited ? " · edited" : ""}`
                  : undefined
              }
              className={cn(
                "cursor-default rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed wrap-break-word",
                isMine
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted/70 text-foreground",
                message.isDeleted && "italic opacity-70",
              )}
            >
              {message.isDeleted ? "Message removed" : message.text}
            </div>,
          )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex -translate-y-2 items-center gap-1 rounded-full border bg-card px-1.5 py-0.5 shadow-sm">
            {Array.from(new Set(message.reactions.map((r) => r.emoji))).map(
              (em) => {
                const r = resolveReaction(em);
                return (
                  <span
                    key={em}
                    title={r.label}
                    className="leading-none"
                  >
                    <ReactionImage reaction={r} size={16} />
                  </span>
                );
              },
            )}
            <span className="text-[10px] text-muted-foreground">
              {message.reactions.length}
            </span>
          </div>
        )}

        {isMine && sendStatus && (
          <div
            className="mt-0.5 flex items-center gap-1 self-end"
            title={
              seenByUsers && seenByUsers.length > 0
                ? `Seen by ${seenByUsers.map((u) => userFullName(u)).join(", ")}`
                : MESSAGE_STATUS_ICONS[sendStatus].label
            }
          >
            <MessageStatusIcon status={sendStatus} />
            {seenByUsers && seenByUsers.length > 0 && (
              <>
                <span className="flex -space-x-1">
                  {seenByUsers.slice(0, 3).map((u) => (
                    <span
                      key={u._id}
                      className="relative size-3.5 overflow-hidden rounded-full ring-1 ring-card"
                    >
                      <Avatar
                        src={getUserAvatar(u)}
                        alt={userFullName(u)}
                        sizes="14px"
                      />
                    </span>
                  ))}
                </span>
                {seenByUsers.length > 3 && (
                  <span className="text-[9px] text-muted-foreground">
                    +{seenByUsers.length - 3}
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {viewerSrc && (
        <ImageViewer
          src={viewerSrc}
          alt={message.media?.fileName || "image"}
          onClose={() => setViewerSrc(null)}
        />
      )}
    </div>
  );
}
