import { baseURL } from "@/constants";
import { ReactionType } from "@/lib/reactions";
import { StoryGroup } from "@/types/features/feed/story";
import { useQuery } from "@tanstack/react-query";

interface Params {
  accessToken: string;
}

export interface StoryReaction {
  user: string;
  type: ReactionType;
  _id: string;
}

interface GetActiveStoriesResponse {
  success: boolean;
  message: string;
  data: StoryGroup[]; // ← use shared type
}

export function useGetActiveStories({ accessToken }: Params) {
  return useQuery({
    queryKey: ["active-stories"],
    queryFn: async () => {
      const res = await fetch(`${baseURL}/stories`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to fetch active stories");
      }

      return res.json() as Promise<GetActiveStoriesResponse>;
    },
    enabled: !!accessToken,
  });
}
