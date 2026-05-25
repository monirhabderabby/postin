import { baseURL } from "@/constants";
import type { ReactionType } from "@/lib/reactions";
import type { FeedPostsResponse } from "@/types/features/feed";
import { GroupPostsResponse, Post } from "@/types/features/posts";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

type ApiRes = {
  success: boolean;
  message: string;
  data?: {
    post: Post;
  };
};

type Params = {
  postId: string;
  groupId: string;
  accessToken: string;
  loggedInUserId: string;
};

export function useReactToPost({ postId, accessToken, groupId }: Params) {
  const queryClient = useQueryClient();
  return useMutation<ApiRes, Error, { type: ReactionType }>({
    mutationKey: ["react-post", postId],

    mutationFn: async ({ type }) => {
      const res = await fetch(`${baseURL}/posts/${postId}/react`, {
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

    onSuccess: (res: ApiRes) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      const updatedPost = res.data?.post;
      if (!updatedPost) {
        // Server said success but didn't return post — avoid corrupting cache
        toast.error("Something went wrong. Please try again.");
        return;
      }

      // cache update

      queryClient.setQueryData<InfiniteData<GroupPostsResponse>>(
        ["group-posts", groupId],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((item) =>
                item._id === postId ? updatedPost : item,
              ),
            })),
          };
        },
      );

      // Same patch for the main feed — otherwise tapping like on a feed card
      // changes nothing visually until the page is refreshed.
      queryClient.setQueryData<InfiniteData<FeedPostsResponse>>(
        ["feed-posts"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((item) =>
                item._id === postId ? updatedPost : item,
              ),
            })),
          };
        },
      );

      // Refresh page-posts feeds so reactions update on page profiles too.
      queryClient.invalidateQueries({ queryKey: ["page-posts"] });
    },
  });
}
