// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { Notification } from "@/utils/db.ts";
import { LINK_STYLES } from "@/utils/constants.ts";
import { timeAgo } from "@/utils/display.ts";

async function fetchNotifications(userLogin: string, cursor: string) {
  let url = `/api/users/${userLogin}/notifications`;
  if (cursor !== "" && cursor !== undefined) url += "?cursor=" + cursor;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Request failed: GET ${url}`);
  return await resp.json() as { notifications: Notification[]; cursor: string };
}

function NotificationSummary(props: Notification) {
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

export default function NotificationsList(props: { userLogin: string }) {
  const notificationsSig = useSignal<Notification[]>([]);
  const cursorSig = useSignal("");
  const isLoadingSig = useSignal(false);

  async function loadMoreNotifications() {
    isLoadingSig.value = true;
    try {
      const { notifications, cursor } = await fetchNotifications(
        props.userLogin,
        cursorSig.value,
      );
      notificationsSig.value = [...notificationsSig.value, ...notifications];
      cursorSig.value = cursor;
    } catch (error) {
      console.log(error.message);
    } finally {
      isLoadingSig.value = false;
    }
  }

  useEffect(() => {
    loadMoreNotifications();
  }, []);

  return (
    <div>
      {notificationsSig.value.length > 0
        ? notificationsSig.value?.map((notification) => (
          <NotificationSummary key={notification.id} {...notification} />
        ))
        : "No notifications yet"}
      {cursorSig.value !== "" && !isLoadingSig.value && (
        <button onClick={loadMoreNotifications} class={LINK_STYLES}>
          Load more
        </button>
      )}
    </div>
  );
}
