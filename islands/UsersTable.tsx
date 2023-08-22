// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { User } from "@/utils/db.ts";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";
import { LINK_STYLES } from "@/utils/constants.ts";

const TH_STYLES = "p-4 text-left";
const TD_STYLES = "p-4";

async function fetchUsers(cursor: string) {
  let url = "/api/users";
  if (cursor !== "") url += "?cursor=" + cursor;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Request failed: GET ${url}`);
  return await resp.json() as { users: User[]; cursor: string };
}

function UserTableRow(props: User) {
  return (
    <tr class="hover:(bg-gray-50 dark:bg-gray-900) border-b border-gray-200">
      <td scope="col" class={TD_STYLES}>
        <GitHubAvatarImg login={props.login} size={32} />
        <a
          class="hover:underline ml-4 align-middle"
          href={"/users/" + props.login}
        >
          {props.login}
        </a>
      </td>
      <td scope="col" class={TD_STYLES + " text-gray-500"}>
        {props.isSubscribed ? "Premium 🦕" : "Basic"}
      </td>
      <td scope="col" class={TD_STYLES + " text-gray-500"}>
        ${(Math.random() * 100).toFixed(2)}
      </td>
    </tr>
  );
}

export default function UsersTable() {
  const usersSig = useSignal<User[]>([]);
  const cursorSig = useSignal("");
  const isLoadingSig = useSignal(false);

  async function loadMoreUsers() {
    isLoadingSig.value = true;
    try {
      const { users, cursor } = await fetchUsers(cursorSig.value);
      usersSig.value = [...usersSig.value, ...users];
      cursorSig.value = cursor;
    } catch (error) {
      console.log(error.message);
    } finally {
      isLoadingSig.value = false;
    }
  }

  useEffect(() => {
    loadMoreUsers();
  }, []);

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
          {usersSig.value.map((user) => <UserTableRow {...user} />)}
        </tbody>
      </table>
      {cursorSig.value !== "" && !isLoadingSig.value && (
        <button
          onClick={loadMoreUsers}
          class={LINK_STYLES + " p-4"}
        >
          Load more
        </button>
      )}
    </div>
  );
}
