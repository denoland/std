// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { Notification } from "@/utils/db.ts";
import { LINK_STYLES } from "@/utils/constants.ts";
import { timeAgo } from "@/utils/display.ts";
import { fetchValues } from "@/utils/http.ts";
import { decodeTime } from "std/ulid/mod.ts";

function NotificationSummary(props: Notification) {
  return (
    <li class="py-4 space-y-1">
      <a href={"/notifications/" + props.id}>
        <span class="mr-4">
          <strong>New {props.type}!</strong>
        </span>
        <span class="text-gray-500">
          {" " + timeAgo(new Date(decodeTime(props.id)))}
        </span>
        <br />
        <span>{props.text}</span>
      </a>
    </li>
  );
}

export default function NotificationsList({ endpoint }: { endpoint: string }) {
  const notificationsSig = useSignal<Notification[]>([]);
  const cursorSig = useSignal("");
  const isLoadingSig = useSignal(false);

  async function loadMoreNotifications() {
    if (isLoadingSig.value) return;
    isLoadingSig.value = true;
    try {
      const { values, cursor } = await fetchValues<Notification>(
        endpoint,
        cursorSig.value,
      );
      notificationsSig.value = [...notificationsSig.value, ...values];
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
      {cursorSig.value !== "" && (
        <button onClick={loadMoreNotifications} class={LINK_STYLES}>
          {isLoadingSig.value ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
