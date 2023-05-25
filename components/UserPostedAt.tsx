// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { User } from "@/utils/db.ts";
import { timeAgo } from "@/utils/display.ts";

export default function UserPostedAt(
  props: { user: User; createdAt: Date },
) {
  return (
    <p class="text-gray-500">
      <img
        src={props.user.avatarUrl}
        alt={props.user.login}
        crossOrigin="anonymous"
        class="h-6 w-auto rounded-full aspect-square inline-block mr-1 align-bottom"
      />
      <a class="hover:underline" href={`/user/${props.user.login}`}>
        {props.user.login}
      </a>{" "}
      {props.user.isSubscribed && (
        <span title="Deno Hunt premium user">🦕{" "}</span>
      )}
      {timeAgo(new Date(props.createdAt))} ago
    </p>
  );
}
