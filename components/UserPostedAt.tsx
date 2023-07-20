// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { User } from "@/utils/db.ts";
import { timeAgo } from "@/utils/display.ts";

export default function UserPostedAt(
  props: { user: User; createdAt: Date },
) {
  return (
    <p class="text-gray-500">
      <img
        // Resize the avatar image to be 36x36 px
        // Although display size is 24x24, lighthouse complains about low resolution if the image is 24x24
        src={props.user.avatarUrl + "&s=36"}
        alt={props.user.login}
        crossOrigin="anonymous"
        class="h-6 w-auto rounded-full inline-block mr-2"
        loading="lazy"
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
