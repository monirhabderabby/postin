import { ReactionType } from "@/lib/reactions";
import { Pagination } from "@/types";

export interface Post {
  video: {
    url: string;
    public_id: string;
    thumbnail: string;
    duration: number;
  };
  videos: VideoInfo[];
  checkIn: {
    name: string;
    coordinates: number[];
  };
  _id: string;
  title: string;
  content: string;
  postType: "text" | "image" | "video" | "reel" | "shared";
  sharedPost: Post | string | null;
  sharedMessage: string;
  mentions: string[];
  feeling: string;
  activity: string;
  backgroundColor: string;
  author: {
    profileImage: CloudinaryImage;
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  group: {
    _id: string;
    name: string;
    privacy: "public" | "private";
    groupUserName: string;
  };
  status: "published" | "draft" | "archived";
  visibility: "public" | "only me" | "friends" | "friends of friends";
  views: number;
  reactionCount: number;
  saveCount: number;
  shareCount: number;
  commentCount: number;
  allowComments: boolean;
  isPinned: boolean;
  isFeatured: boolean;
  reportedBy: string[];
  reportCount: number;
  hiddenFor: string[];
  isDeleted: boolean;
  images: PostImage[];
  reactions: Reaction[];
  publishedAt: string;
  excerpt: string;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  comments: string[];
  id: string;
  isSaved: boolean;
  tags: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profileImage: CloudinaryImage;
  }[];
}

export interface ReactionUser {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  profileImage: CloudinaryImage;
}

export interface PostImage {
  url: string;
  public_id: string;
  _id: string;
  id: string;
}

export type Reaction = {
  user: ReactionUser;
  type: ReactionType;
  mutualFriendCount: number;
  mutualFriends: ReactionUser[]; // if mutual friends are users (same shape). If different, change type.
  isMutualFriend: boolean;
};

export type VideoInfo = {
  url: string;
  public_id: string;
  thumbnail: string;
  duration: number;
  id: string;
};

export interface CloudinaryImage {
  public_id: string;
  url: string;
}

export interface GroupPostsResponse {
  success: boolean;
  message: string;
  data: Post[];
  pagination: Pagination;
}
