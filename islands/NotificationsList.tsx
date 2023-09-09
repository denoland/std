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
    <div class="py-4 space-y-1">
      <a href={"/notifications/" + props.id}>
        <p class="mr-4">New {props.type}</p>
        <p class="text-gray-500">
          {props.text + " " + timeAgo(new Date(decodeTime(props.id)))}
        </p>
      </a>
    </div>
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
    notificationsSig.value.length === 0
      ? <p>No notifications yet</p>
      : (
        <div class="divide-y">
          {notificationsSig.value?.map((notification) => (
            <NotificationSummary key={notification.id} {...notification} />
          ))}
          {cursorSig.value !== "" && (
            <button onClick={loadMoreNotifications} class={LINK_STYLES}>
              {isLoadingSig.value ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )
  );
}
