// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import type { AccountState } from "./_middleware.ts";
import {
  deleteNotification,
  getNotification,
  getNotificationsByUser,
  Notification,
} from "@/utils/db.ts";
import { redirect } from "@/utils/redirect.ts";
import { timeAgo } from "@/utils/display.ts";

export interface NotificationState extends AccountState {
  notifications: Notification[];
}

export function compareCreatedAt(a: Notification, b: Notification) {
  return Number(b.createdAt) - Number(a.createdAt);
}

export const handler: Handlers<NotificationState, AccountState> = {
  async GET(_request, ctx) {
    const notifications = (await getNotificationsByUser(ctx.state.user.id))!
      .toSorted(compareCreatedAt);

    ctx.state.title = "Notifications";

    return ctx.render({ ...ctx.state, notifications });
  },
  async POST(req) {
    const form = await req.formData();
    const originUrl = form.get("originUrl")!;
    const notificationId = form.get("notificationId");

    if (typeof originUrl !== "string" || typeof notificationId !== "string") {
      return new Response(null, { status: 400 });
    }

    const notification = await getNotification(notificationId);
    await deleteNotification(notification!);

    return redirect(originUrl);
  },
};

interface RowProps {
  notification: Notification;
}

function Row(props: RowProps) {
  return (
    <li class="py-4">
      <form method="post">
        <input
          type="hidden"
          name="originUrl"
          value={props.notification.originUrl}
        />
        <input
          type="hidden"
          name="notificationId"
          value={props.notification.id}
        />
        <button class="text-left" type="submit">
          <strong>New {props.notification.type}!</strong>
          <span class="text-gray-500 text-sm">
            {" " + timeAgo(new Date(props.notification.createdAt))} ago
          </span>
          <p>
            {props.notification.text}
          </p>
        </button>
      </form>
    </li>
  );
}

export default function NotificationPage(props: PageProps<NotificationState>) {
  return (
    <main class="flex-1 p-4">
      <h1 class="text-3xl font-bold py-4">Notification Center</h1>
      <ul>
        {props.data.notifications.length > 0
          ? props.data.notifications.map((notification) => (
            <Row
              notification={notification}
            />
          ))
          : "No notifications yet"}
      </ul>
    </main>
  );
}
