import { ReactionImage } from "@/components/shared/reactions/reaction-image";
import { REACTIONS, resolveReaction } from "@/lib/reactions";
import { Reaction } from "@/types/features/posts";
import { useState } from "react";

import dynamic from "next/dynamic";
const ReactionsModal = dynamic(() => import("./reaction-modal"), {
  ssr: false,
});

interface OverlappingReactionsProps {
  reactions: Reaction[];
  maxDisplay?: number;
  loggedInUserId: string;
}

export default function OverlappingReactions({
  reactions,
  maxDisplay = 3,
  loggedInUserId,
}: OverlappingReactionsProps) {
  const [open, setOpen] = useState(false);
  // Count reactions by type
  const reactionCounts = reactions.reduce(
    (acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Sort by count (descending) and get top reactions
  const sortedReactions = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxDisplay)
    .map(([type, count]) => ({
      type,
      count,
      ...REACTIONS.find((r) => r.type === type),
    }));

  const totalCount = reactions.length;

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Overlapping emoji circles */}
        <div className="relative flex items-center w-auto">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {sortedReactions.map((reaction: any, index) => (
            <div
              key={reaction.type}
              className="relative w-6 h-6 rounded-full flex items-center justify-center bg-white text-sm font-bold border-2 border-white shadow-sm"
              style={{
                marginLeft: index === 0 ? 0 : "-12px",
                zIndex: sortedReactions.length - index,
              }}
              title={`${reaction.label}: ${reaction.count}`}
            >
              <ReactionImage reaction={resolveReaction(reaction.type)} size={18} />
            </div>
          ))}
        </div>

        {/* Count display */}
        <div
          className="text-sm font-semibold text-gray-600 cursor-pointer hover:underline"
          title={`Total reaction ${totalCount}`}
          onClick={() => setOpen((p) => !p)}
        >
          {totalCount}
        </div>
      </div>

      {open && (
        <ReactionsModal
          isOpen={open}
          onClose={() => setOpen(false)}
          reactions={reactions}
          loggedInUserId={loggedInUserId}
        />
      )}
    </>
  );
}
