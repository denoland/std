// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Comment } from "@/utils/db.ts";
import UserPostedAt from "@/components/UserPostedAt.tsx";
import { LINK_STYLES } from "@/utils/constants.ts";

async function fetchComments(itemId: string, cursor: string) {
  let url = `/api/items/${itemId}/comments`;
  if (cursor !== "" && cursor !== undefined) url += "?cursor=" + cursor;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Request failed: GET ${url}`);
  return await resp.json() as { comments: Comment[]; cursor: string };
}

function CommentSummary(props: Comment) {
  return (
    <div class="py-4">
      <UserPostedAt {...props} />
      <p>{props.text}</p>
    </div>
  );
}

export default function CommentsList(props: { itemId: string }) {
  const commentsSig = useSignal<Comment[]>([]);
  const cursorSig = useSignal("");
  const isLoadingSig = useSignal(false);

  async function loadMoreComments() {
    isLoadingSig.value = true;
    try {
      const { comments, cursor } = await fetchComments(
        props.itemId,
        cursorSig.value,
      );
      commentsSig.value = [...commentsSig.value, ...comments];
      cursorSig.value = cursor;
    } catch (error) {
      console.log(error.message);
    } finally {
      isLoadingSig.value = false;
    }
  }

  useEffect(() => {
    loadMoreComments();
  }, []);

  return (
    <div>
      {commentsSig.value.map((comment) => (
        <CommentSummary key={comment.id} {...comment} />
      ))}
      {cursorSig.value !== "" && !isLoadingSig.value && (
        <button onClick={loadMoreComments} class={LINK_STYLES}>
          Load more
        </button>
      )}
    </div>
  );
}
