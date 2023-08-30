// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import type { SignedInState } from "@/utils/middleware.ts";
import { HEADING_WITH_MARGIN_STYLES } from "@/utils/constants.ts";
import NotificationsList from "@/islands/NotificationsList.tsx";

// deno-lint-ignore require-await
export default async function NotificationsPage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  return (
    <>
      <Head title="Notifications" href={ctx.url.href} />
      <main class="flex-1 p-4">
        <h1 class={HEADING_WITH_MARGIN_STYLES}>Notifications</h1>
        <NotificationsList />
      </main>
    </>
  );
}
