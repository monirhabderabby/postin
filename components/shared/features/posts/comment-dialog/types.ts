import { ReactionType } from "@/lib/reactions";
import { Comment } from "@/types/features/posts/comments";

export type { ReactionType };

// ─── Mentionable member ───────────────────────────────────────────────────────

export interface MentionableMember {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
}

// ─── Mapped comment (UI shape) ────────────────────────────────────────────────

export interface MappedCommentAuthor {
  name: string;
  avatar: string;
  _id: string;
}

export interface MappedComment {
  _id: string;
  author: MappedCommentAuthor;
  content: string;
  likes: number;
  userReaction: ReactionType | null;
  createdAt: string;
  images: string[];
  replies: MappedComment[];
  _raw: Comment;
  _optimistic?: true;
}

// ─── Reaction meta ────────────────────────────────────────────────────────────

export interface ReactionMeta {
  type: string;
  emoji: string;
  color: string;
}

export const REACTION_META: ReactionMeta[] = [
  { type: "like", emoji: "👍", color: "#1877f2" },
  { type: "love", emoji: "❤️", color: "#f33e58" },
  { type: "haha", emoji: "😆", color: "#f7b928" },
  { type: "wow", emoji: "😮", color: "#f7b928" },
  { type: "sad", emoji: "😢", color: "#f7b928" },
  { type: "angry", emoji: "😡", color: "#e9710f" },
  { type: "care", emoji: "\uD83E\uDD70", color: "#f7b928" },
];

export const CURRENT_USER_AVATAR = ""; // swap with real current-user avatar/hook
