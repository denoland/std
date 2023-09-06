// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import type { SignedInState } from "@/middleware/session.ts";
import { HEADING_WITH_MARGIN_STYLES } from "@/utils/constants.ts";
import NotificationsList from "@/islands/NotificationsList.tsx";

// deno-lint-ignore require-await
export default async function NotificationsPage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  const endpoint = "/api/me/notifications";

  return (
    <>
      <Head title="Notifications" href={ctx.url.href}>
        <link
          as="fetch"
          crossOrigin="anonymous"
          href={endpoint}
          rel="preload"
        />
      </Head>
      <main class="flex-1 p-4">
        <h1 class={HEADING_WITH_MARGIN_STYLES}>Notifications</h1>
        <NotificationsList endpoint={endpoint} />
      </main>
    </>
  );
}
