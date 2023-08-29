// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Item } from "@/utils/db.ts";
import { useSignal } from "@preact/signals";

export interface VoteButtonProps {
  item: Item;
  isVoted: boolean;
}

export default function VoteButton(props: VoteButtonProps) {
  const isVoted = useSignal(props.isVoted);
  const score = useSignal(props.item.score);
  const url = `/api/items/${props.item.id}/vote`;

  async function onClick(event: MouseEvent) {
    if (event.detail !== 1) return;
    const method = isVoted.value ? "DELETE" : "POST";
    const resp = await fetch(url, { method });

    if (resp.status === 401) {
      window.location.href = "/signin";
      return;
    }
    if (!resp.ok) throw new Error(`Request failed: ${method} ${url}`);

    isVoted.value = !isVoted.value;
    method === "POST" ? score.value++ : score.value--;
  }

  return (
    <button
      class={(isVoted.value ? "text-primary" : "text-inherit") +
        " pr-2 text-center"}
      onClick={onClick}
    >
      ▲
      <br />
      {score}
    </button>
  );
}
