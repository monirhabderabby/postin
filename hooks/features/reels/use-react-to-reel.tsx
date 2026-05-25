import { baseURL } from "@/constants";
import type { ReactionType } from "@/lib/reactions";
import { ReelsResponse } from "@/types/features/reels";
import { Post } from "@/types/features/posts";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { REELS_QUERY_KEY } from "./use-get-reels";

type ApiRes = {
  success: boolean;
  message: string;
  data?: {
    post: Post;
  };
};

type Params = {
  reelId: string;
  accessToken: string;
};

export function useReactToReel({ reelId, accessToken }: Params) {
  const queryClient = useQueryClient();

  return useMutation<ApiRes, Error, { type: ReactionType }>({
    mutationKey: ["react-reel", reelId],

    mutationFn: async ({ type }) => {
      const res = await fetch(`${baseURL}/posts/${reelId}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
          const body = await res.json();
          message = body?.message ?? message;
        } catch {}
        throw new Error(message);
      }

      return res.json();
    },

    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      const updated = res.data?.post;
      if (!updated) return;

      queryClient.setQueryData<InfiniteData<ReelsResponse>>(
        REELS_QUERY_KEY,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((item) =>
                item._id === reelId ? { ...item, ...updated } : item,
              ),
            })),
          };
        },
      );
    },

    onError: (err) => {
      toast.error(err.message || "Could not react to reel");
    },
  });
}
