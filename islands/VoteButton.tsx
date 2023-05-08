// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Item, Vote } from "@/utils/db.ts";

export default function VoteButton(
  props: { item: Item; votes: Vote[] | [] },
) {
  const upvoted = !!props.votes.filter((item) => item.itemId === props.item.id)
    .length;
  const voteId = props.votes.find((item) => item.itemId === props.item.id)?.id;
  return (
    <button
      class={`cursor-pointer mr-2 ${
        upvoted ? "text-pink-700" : "text-gray-300"
      }`}
      type="submit"
      onClick={() => {
        const url = `/api/vote?item_id=${props.item.id}`;
        const method = upvoted ? "DELETE" : "POST";
        fetch(url, {
          method,
          credentials: "same-origin",
        });
      }}
    >
      ▲
    </button>
  );
}
