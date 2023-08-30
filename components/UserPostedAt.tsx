// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { timeAgo } from "@/utils/display.ts";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";

export default function UserPostedAt(
  props: { userLogin: string; createdAt: Date },
) {
  return (
    <p class="text-gray-500">
      <GitHubAvatarImg
        login={props.userLogin}
        size={24}
        class="mr-2"
      />
      <a class="hover:underline" href={`/users/${props.userLogin}`}>
        {props.userLogin}
      </a>{" "}
      {timeAgo(new Date(props.createdAt))}
    </p>
  );
}
