// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import TabsBar from "@/components/TabsBar.tsx";
import { HEADING_WITH_MARGIN_STYLES } from "@/utils/constants.ts";
import UsersTable from "@/islands/UsersTable.tsx";

// deno-lint-ignore require-await
export default async function DashboardUsersPage(
  _req: Request,
  ctx: RouteContext,
) {
  const endpoint = "/api/users";

  return (
    <>
      <Head title="Users" href={ctx.url.href}>
        <link
          as="fetch"
          crossOrigin="anonymous"
          href={endpoint}
          rel="preload"
        />
      </Head>
      <main class="flex-1 p-4">
        <h1 class={HEADING_WITH_MARGIN_STYLES}>Dashboard</h1>
        <TabsBar
          links={[{
            path: "/dashboard/stats",
            innerText: "Stats",
          }, {
            path: "/dashboard/users",
            innerText: "Users",
          }]}
          currentPath={ctx.url.pathname}
        />
        <UsersTable endpoint={endpoint} />
      </main>
    </>
  );
}
