// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { getNotificationsByUser, Notification } from "@/utils/db.ts";
import { timeAgo } from "@/utils/display.ts";
import Head from "@/components/Head.tsx";
import type { SignedInState } from "@/utils/middleware.ts";
import { HEADING_STYLES } from "@/utils/constants.ts";

interface NotificationsState extends SignedInState {
  notifications: Notification[];
}

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, NotificationsState> = {
  async GET(_req, ctx) {
    const notifications = await getNotificationsByUser(ctx.state.user.login);

    return await ctx.render({ ...ctx.state, notifications });
  },
};

function compareCreatedAt(a: Notification, b: Notification) {
  return Number(b.createdAt) - Number(a.createdAt);
}

function Row(props: Notification) {
  return (
    <li class="py-4 space-y-1">
      <a href={"/notifications/" + props.id}>
        <span class="mr-4">
          <strong>New {props.type}!</strong>
        </span>
        <span class="text-gray-500">
          {" " + timeAgo(props.createdAt)} ago
        </span>
        <br />
        <span>{props.text}</span>
      </a>
    </li>
  );
}

export default function NotificationsPage(
  props: PageProps<NotificationsState>,
) {
  return (
    <>
      <Head title="Notifications" href={props.url.href} />
      <main class="flex-1 p-4">
        <h1 class={HEADING_STYLES}>Notifications</h1>
        <ul class="divide-y">
          {props.data.notifications.length > 0
            ? props.data.notifications
              .toSorted(compareCreatedAt)
              .map((notification) => <Row {...notification} />)
            : "No notifications yet"}
        </ul>
      </main>
    </>
  );
}
