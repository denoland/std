// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import { getNotificationsByUser, Notification } from "@/utils/db.ts";
import { timeAgo } from "@/utils/display.ts";
import Head from "@/components/Head.tsx";
import type { SignedInState } from "@/utils/middleware.ts";
import { HEADING_STYLES } from "@/utils/constants.ts";

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

export default async function NotificationsPage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  const notifications = await getNotificationsByUser(ctx.state.user.login);

  return (
    <>
      <Head title="Notifications" href={ctx.url.href} />
      <main class="flex-1 p-4">
        <h1 class={HEADING_STYLES}>Notifications</h1>
        <ul class="divide-y">
          {notifications.length > 0
            ? notifications
              .toSorted(compareCreatedAt)
              .map((notification) => <Row {...notification} />)
            : "No notifications yet"}
        </ul>
      </main>
    </>
  );
}
