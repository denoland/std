// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { User } from "@/utils/db.ts";
import { timeAgo } from "@/utils/display.ts";

export default function UserPostedAt(
  props: { user: User; createdAt: Date },
) {
  return (
    <p class="text-gray-500">
      {props.user.login}{" "}
      {props.user.isSubscribed && (
        <span title="Deno Hunt premium user">🦕{" "}</span>
      )}
      {timeAgo(new Date(props.createdAt))} ago
    </p>
  );
}
