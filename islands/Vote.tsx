// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Item, Vote } from "@/utils/db.ts";

export default function VoteBtn(
  props: { item: Item; votes: Vote[] | []; curUserId?: string },
) {
  const upvoted = !!props.votes.filter((item) => item.itemId === props.item.id)
    .length;
  const voteId = props.votes.find((item)=>item.itemId===props.item.id)?.id;
  return (
    <button
      class={`cursor-pointer mr-2 ${
        upvoted ? "text-pink-700" : "text-gray-300"
      }`}
      type="submit"
      onClick={() => {
        const url = new URL("/api/vote", location.href);
        url.searchParams.set("to", props.item.id);
        if (upvoted) url.searchParams.set("vote", voteId as string);
        fetch(url, {
          method: "POST",
          credentials: "same-origin",
        }).then((res) => {
          if (res.ok) {
            location.assign(window.location.href);
          } else {
            location.assign("/login");
          }
        });
      }}
    >
      ▲
    </button>
  );
}
