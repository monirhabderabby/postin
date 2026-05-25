export const REACTIONS = [
  {
    type: "like",
    emoji: "\uD83D\uDC4D",
    label: "Like",
    color: "#1877f2",
    staticSrc: "/features/message/static/Like-01.png",
    animatedSrc: "/features/message/anaimated/like.gif",
  },
  {
    type: "love",
    emoji: "\u2764\uFE0F",
    label: "Love",
    color: "#f33e58",
    staticSrc: "/features/message/static/heart-01.png",
    animatedSrc: "/features/message/anaimated/heart.gif",
  },
  {
    type: "haha",
    emoji: "\uD83D\uDE06",
    label: "Haha",
    color: "#f7b928",
    staticSrc: "/features/message/static/Ha%20ha-01.png",
    animatedSrc: "/features/message/anaimated/Ha-ha.gif",
  },
  {
    type: "wow",
    emoji: "\uD83D\uDE2E",
    label: "Wow",
    color: "#f7b928",
    staticSrc: "/features/message/static/Wow-01.png",
    animatedSrc: "/features/message/anaimated/Wow.gif",
  },
  {
    type: "sad",
    emoji: "\uD83D\uDE22",
    label: "Sad",
    color: "#f7b928",
    staticSrc: "/features/message/static/Sad-01.png",
    animatedSrc: "/features/message/anaimated/Sad.gif",
  },
  {
    type: "angry",
    emoji: "\uD83D\uDE21",
    label: "Angry",
    color: "#e9710f",
    staticSrc: "/features/message/static/Angry-01.png",
    animatedSrc: "/features/message/anaimated/Angry.gif",
  },
  {
    type: "care",
    emoji: "\uD83E\uDD70",
    label: "Care",
    color: "#f7b928",
    staticSrc: "/features/message/static/Care-01.png",
    animatedSrc: "/features/message/anaimated/Care.gif",
  },
] as const;

export type ReactionDefinition = (typeof REACTIONS)[number];
export type ReactionType = ReactionDefinition["type"];

export type ResolvedReaction =
  | ReactionDefinition
  | {
      type: string;
      emoji: string;
      label: string;
      color: string;
      staticSrc?: undefined;
      animatedSrc?: undefined;
    };

export const QUICK_REACTIONS = REACTIONS.slice(0, 5);

export function getReactionByType(type?: string | null) {
  if (!type) return null;
  return REACTIONS.find((reaction) => reaction.type === type) ?? null;
}

export function resolveReaction(value: string): ResolvedReaction {
  const byEmoji = REACTIONS.find((reaction) => reaction.emoji === value);
  if (byEmoji) return byEmoji;

  const byType = getReactionByType(value.toLowerCase());
  if (byType) return byType;

  return { type: value, emoji: value, label: value, color: "#888" };
}
