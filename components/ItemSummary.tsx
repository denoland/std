// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import VoteButton from "@/islands/VoteButton.tsx";
import type { Item } from "@/utils/db.ts";
import UserPostedAt from "./UserPostedAt.tsx";
import StaticVoteButton from "./StaticVoteButton.tsx";
import { decodeTime } from "std/ulid/mod.ts";

export interface ItemSummaryProps {
  item: Item;
  isVoted: boolean;
  isSignedIn: boolean;
}

export default function ItemSummary(props: ItemSummaryProps) {
  return (
    <div class="py-2 flex gap-4">
      {props.isSignedIn
        ? (
          <VoteButton
            item={props.item}
            isVoted={props.isVoted}
          />
        )
        : <StaticVoteButton score={props.item.score} />}
      <div class="space-y-1">
        <p>
          <a
            class="visited:(text-[purple] dark:text-[lightpink]) hover:underline mr-4"
            href={`/items/${props.item.id}`}
          >
            {props.item.title}
          </a>
          <a
            class="hover:underline text-gray-500"
            href={props.item.url}
            target="_blank"
          >
            {new URL(props.item.url).host} ↗
          </a>
        </p>
        <UserPostedAt
          userLogin={props.item.userLogin}
          createdAt={new Date(decodeTime(props.item.id))}
        />
      </div>
    </div>
  );
}
