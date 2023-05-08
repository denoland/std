// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Item, Vote } from "@/utils/db.ts";
import { useState } from "preact/hooks";

export default function VoteButton(
  props: { item: Item; votes: Vote[] | [] },
) {
  const [isVoted, setISVoted] = useState(
    !!props.votes.filter((item) => item.itemId === props.item.id)
      .length,
  );
  const changePoint = () => {
    const scoreElement = document.getElementById(`score-${props.item.id}`);
    if (scoreElement) {
      const [point] = scoreElement.innerHTML.split(" ");
      const score = isVoted ? +point - 1 : +point + 1;
      scoreElement.innerHTML = score === 1
        ? `${score} point`
        : `${score} points`;
    }
  };
  return (
    <button
      class={`cursor-pointer mr-2 ${
        isVoted ? "text-pink-700" : "text-gray-300"
      }`}
      type="submit"
      onClick={async () => {
        const url = `/api/vote?item_id=${props.item.id}`;
        const method = isVoted ? "DELETE" : "POST";
        const api = await fetch(url, {
          method,
          credentials: "same-origin",
        });
        if (api.status === 201 || api.status === 204) {
          setISVoted(!isVoted);
          changePoint();
        }
      }}
    >
      ▲
    </button>
  );
}
