"use client";

import { cn } from "@/lib/utils";
import type { ResolvedReaction } from "@/lib/reactions";
import Image from "next/image";

interface ReactionImageProps {
  reaction: ResolvedReaction;
  animated?: boolean;
  size?: number;
  className?: string;
}

export function ReactionImage({
  reaction,
  animated = false,
  size = 28,
  className,
}: ReactionImageProps) {
  const src = animated ? reaction.animatedSrc : reaction.staticSrc;

  if (!src) {
    return (
      <span
        className={cn("inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
        aria-label={reaction.label}
        title={reaction.label}
      >
        {reaction.emoji}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={reaction.label}
      width={size}
      height={size}
      unoptimized
      draggable={false}
      className={cn("inline-block object-contain", className)}
      style={{ width: size, height: size }}
      title={reaction.label}
    />
  );
}
