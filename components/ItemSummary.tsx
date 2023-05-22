// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import VoteButton from "@/islands/VoteButton.tsx";
import type { Item, User } from "@/utils/db.ts";
import UserPostedAt from "./UserPostedAt.tsx";

export interface ItemSummaryProps {
  item: Item;
  user: User;
  isVoted: boolean;
}

export default function ItemSummary(props: ItemSummaryProps) {
  return (
    <div class="py-2 flex gap-2 text-gray-500">
      <VoteButton
        item={props.item}
        isVoted={props.isVoted}
      />
      <div>
        <span class="mr-2">
          <a class="text-black hover:underline" href={`/item/${props.item.id}`}>
            {props.item.title}
          </a>
        </span>
        <span>
          <a class="hover:underline" href={props.item.url} target="_blank">
            {new URL(props.item.url).host} ↗
          </a>
        </span>
        <UserPostedAt user={props.user} createdAt={props.item.createdAt} />
      </div>
    </div>
  );
}
