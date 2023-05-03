// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Item } from "@/utils/db.ts";

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

export default function ItemSummary(props: Item) {
  return (
    <div class="py-2">
      <div>
        <span class="cursor-pointer mr-2 text-gray-300">▲</span>
        <span class="mr-2">
          <a href={props.url}>{props.title}</a>
        </span>
        <span class="text-gray-500">
          {new URL(props.url).host}
        </span>
      </div>
      <div class="text-gray-500">
        {pluralize(props.score, "point")} by {props.userId}{" "}
        {timeAgo(new Date(props.createdAt))} ago •{" "}
        <a href={`/item/${props.id}`}>
          {pluralize(props.commentsCount, "comment")}
        </a>
      </div>
    </div>
  );
}
