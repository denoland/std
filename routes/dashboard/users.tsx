// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { getUsers, User } from "@/utils/db.ts";
import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";
import Head from "@/components/Head.tsx";
import TabsBar from "@/components/TabsBar.tsx";
import { HEADING_WITH_MARGIN_STYLES } from "@/utils/constants.ts";

interface UsersState extends State {
  users: User[];
}

export const handler: Handlers<UsersState, State> = {
  async GET(_req, ctx) {
    const users = await getUsers();
    return await ctx.render({ ...ctx.state, users });
  },
};

const TH_STYLES = "p-4 text-left";
const TD_STYLES = "p-4";

function UsersTable(props: { users: User[] }) {
  return (
    <div class="w-full rounded-lg shadow border-1 border-gray-300 overflow-x-auto">
      <table class="table-auto border-collapse w-full">
        <thead class="border-b border-gray-300">
          <tr>
            <th scope="col" class={TH_STYLES}>User</th>
            <th scope="col" class={TH_STYLES}>Subscription</th>
            <th scope="col" class={TH_STYLES}>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {props.users.map((user) => (
            <tr class="hover:(bg-gray-50 dark:bg-gray-900) border-b border-gray-200">
              <td scope="col" class={TD_STYLES}>
                <GitHubAvatarImg login={user.login} size={32} />
                <a
                  class="hover:underline ml-4 align-middle"
                  href={"/users/" + user.login}
                >
                  {user.login}
                </a>
              </td>
              <td scope="col" class={TD_STYLES + " text-gray-500"}>
                {user.isSubscribed ? "Premium 🦕" : "Basic"}
              </td>
              <td scope="col" class={TD_STYLES + " text-gray-500"}>
                ${(Math.random() * 100).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UsersPage(props: PageProps<UsersState>) {
  return (
    <>
      <Head title="Users" href={props.url.href} />
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
          currentPath={props.url.pathname}
        />
        <UsersTable users={props.data.users} />
      </main>
    </>
  );
}
