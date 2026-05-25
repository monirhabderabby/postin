import { baseURL } from "@/constants";
import { ReactionType } from "@/lib/reactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Params {
  postId: string;
  accessToken: string;
}

interface ReactPayload {
  commentId: string;
  type: ReactionType;
}

export function useReactToComment({ postId, accessToken }: Params) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["react-to-comment", postId],
    mutationFn: async ({ commentId, type }: ReactPayload) => {
      const res = await fetch(`${baseURL}/comments/react/${commentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to react to comment");
      }

      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
  });
}
