"use client";

import { ReactionImage } from "@/components/shared/reactions/reaction-image";
import { REACTIONS } from "@/lib/reactions";
import { useEffect, useRef, useState } from "react";

interface Props {
  onPick: (emoji: string) => void;
  onMore: () => void;
  onClose: () => void;
}

export function ReactionsBar({ onPick, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-2 shadow-lg ring-1 ring-black/5"
    >
      {REACTIONS.map((r) => (
        <button
          key={r.type}
          type="button"
          onClick={() => onPick(r.emoji)}
          onMouseEnter={() => setHoveredReaction(r.type)}
          onMouseLeave={() => setHoveredReaction(null)}
          title={r.label}
          className="cursor-pointer transition hover:scale-125"
        >
          <ReactionImage
            reaction={r}
            animated={hoveredReaction === r.type}
            size={28}
          />
        </button>
      ))}
    </div>
  );
}
