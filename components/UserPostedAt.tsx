// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { User } from "@/utils/db.ts";
import { timeAgo } from "@/utils/display.ts";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";

export default function UserPostedAt(
  props: { user: User; createdAt: Date },
) {
  return (
    <p class="text-gray-500">
      <GitHubAvatarImg
        login={props.user.login}
        size={24}
        class="mr-2"
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
