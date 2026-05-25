import { baseURL } from "@/constants";
import { ReactionType } from "@/lib/reactions";
import { useMutation } from "@tanstack/react-query";

interface Params {
  accessToken: string;
}

interface ReactToStoryBody {
  storyId: string;
  type: ReactionType;
}

interface StoryReaction {
  user: string;
  type: ReactionType;
  _id: string;
}

interface ReactToStoryResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    user: string;
    media: string[];
    viewers: string[];
    privacy: "public" | "friends" | "custom";
    customAudience: string[];
    text: string;
    backgroundColor: string;
    replyCount: number;
    expiresAt: string;
    reactions: StoryReaction[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

export function useReactToStory({ accessToken }: Params) {
  return useMutation({
    mutationKey: ["react-to-story"],
    mutationFn: async ({ storyId, type }: ReactToStoryBody) => {
      const res = await fetch(`${baseURL}/stories/${storyId}/react`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to react to story");
      }

      return res.json() as Promise<ReactToStoryResponse>;
    },
  });
}
