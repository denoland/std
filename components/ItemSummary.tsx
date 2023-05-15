// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import VoteButton from "@/islands/VoteButton.tsx";
import { Item, User } from "@/utils/db.ts";

export function pluralize(unit: number, label: string) {
  return unit === 1 ? `${unit} ${label}` : `${unit} ${label}s`;
}

/** @todo Replace with https://deno.land/std@0.184.0/datetime/mod.ts?s=difference */
export function timeAgo(time: number | Date) {
  const between = (Date.now() - Number(time)) / 1000;
  if (between < 3600) return pluralize(~~(between / 60), "minute");
  else if (between < 86400) return pluralize(~~(between / 3600), "hour");
  else return pluralize(~~(between / 86400), "day");
}

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
        <p>
          {props.user.login}{" "}
          {props.user?.isSubscribed && (
            <span title="Deno Hunt premium user">🦕{" "}</span>
          )}
          {timeAgo(new Date(props.item.createdAt))} ago
        </p>
      </div>
    </div>
  );
}
