import { ReactionType } from "@/lib/reactions";
import { Pagination } from "@/types";
import { CloudinaryImage } from "..";

// ─── Comment Author ───────────────────────────────────────────────────────────

export interface CommentAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImage: CloudinaryImage;
}

// ─── Reaction User (different from author) ────────────────────────────────────

export interface ReactionUser extends CommentAuthor {
  name: string;
}

// ─── Comment Reaction ─────────────────────────────────────────────────────────

export interface CommentReaction {
  user: ReactionUser;
  type: ReactionType;
  mutualFriendCount: number;
  mutualFriends: string[];
  isMutualFriend: boolean;
}

// ─── Comment ──────────────────────────────────────────────────────────────────

export interface Comment {
  _id: string;
  post: string;
  author: CommentAuthor;
  parentComment: string | null;
  content: string;
  mentions: string[];
  reactionCount: number;
  repliesCount: number;
  editedAt: string | null;
  isDeleted: boolean;
  images: CloudinaryImage[];
  reactions: CommentReaction[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  replies: Comment[];
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface GetCommentsResponse {
  success: boolean;
  message: string;
  data: Comment[];
  pagination: Pagination;
}
