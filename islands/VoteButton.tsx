// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Item, Vote } from "@/utils/db.ts";
import { useState } from "preact/hooks";

export interface VoteButtonProps {
  item: Item;
  isVoted: boolean;
}

export default function VoteButton(
  props: VoteButtonProps,
) {
  const [upVoted, setUpVoted] = useState(
    props.isVoted,
  );
  return (
    <button
      class={`cursor-pointer mr-2 ${
        upVoted ? "text-pink-700" : "text-gray-300"
      }`}
      type="submit"
      onClick={async () => {
        const url = `/api/vote?item_id=${props.item.id}`;
        const method = upVoted ? "DELETE" : "POST";
        const api = await fetch(url, {
          method,
          credentials: "same-origin",
        });
        if (api.status === 201 || api.status === 204) {
          setUpVoted(!upVoted);
        }
      }}
    >
      ▲
    </button>
  );
}
