// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import type { State } from "@/middleware/session.ts";
import { getUser } from "@/utils/db.ts";
import IconBrandGithub from "tabler_icons_tsx/brand-github.tsx";
import { LINK_STYLES } from "@/utils/constants.ts";
import Head from "@/components/Head.tsx";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";
import ItemsList from "@/islands/ItemsList.tsx";

function Profile(
  props: { login: string; isSubscribed: boolean },
) {
  return (
    <div class="flex flex-col items-center w-[16rem]">
      <GitHubAvatarImg login={props.login} size={200} />
      <div class="flex gap-x-2 px-4 mt-4">
        <div class="font-semibold text-xl">
          {props.login}
        </div>
        {props.isSubscribed && (
          <span title="Deno Hunt premium user">🦕{" "}</span>
        )}
        <a
          href={`https://github.com/${props.login}`}
          aria-label={`${props.login}'s GitHub profile`}
          class={LINK_STYLES}
          target="_blank"
        >
          <IconBrandGithub class="w-6" />
        </a>
      </div>
    </div>
  );
}

export default async function UsersUserPage(
  _req: Request,
  ctx: RouteContext<undefined, State>,
) {
  const { login } = ctx.params;
  const user = await getUser(login);
  if (user === null) return await ctx.renderNotFound();
  const isSignedIn = ctx.state.sessionUser !== undefined;

  return (
    <>
      <Head title={user.login} href={ctx.url.href}>
        <link
          as="fetch"
          crossOrigin="anonymous"
          href={`/api/users/${login}/items`}
          rel="preload"
        />
      </Head>
      <main class="flex-1 p-4 flex flex-col md:flex-row gap-8">
        <div class="flex justify-center p-4">
          <Profile isSubscribed={user.isSubscribed} login={user.login} />
        </div>
        <ItemsList
          endpoint={`/api/users/${user.login}/items`}
          isSignedIn={isSignedIn}
        />
      </main>
    </>
  );
}
