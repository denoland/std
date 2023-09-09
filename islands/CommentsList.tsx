// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Comment } from "@/utils/db.ts";
import UserPostedAt from "@/components/UserPostedAt.tsx";
import { LINK_STYLES } from "@/utils/constants.ts";
import { fetchValues } from "@/utils/http.ts";
import { decodeTime } from "std/ulid/mod.ts";

function CommentSummary(props: Comment) {
  return (
    <div class="py-4">
      <UserPostedAt createdAt={new Date(decodeTime(props.id))} {...props} />
      <p>{props.text}</p>
    </div>
  );
}

export default function CommentsList({ endpoint }: { endpoint: string }) {
  const commentsSig = useSignal<Comment[]>([]);
  const cursorSig = useSignal("");
  const isLoadingSig = useSignal(false);

  async function loadMoreComments() {
    if (isLoadingSig.value) return;
    isLoadingSig.value = true;
    try {
      const { values, cursor } = await fetchValues<Comment>(
        endpoint,
        cursorSig.value,
      );
      commentsSig.value = [...commentsSig.value, ...values];
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
      {cursorSig.value !== "" && (
        <button onClick={loadMoreComments} class={LINK_STYLES}>
          {isLoadingSig.value ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
