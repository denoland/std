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
    <div class="flex flex-wrap py-8">
      <GitHubAvatarImg login={props.login} size={48} />
      <div class="px-4">
        <div class="flex gap-x-2">
          <span>
            <strong>{props.login}</strong>
          </span>
          {props.isSubscribed && (
            <span title="Deno Hunt premium user">🦕{" "}</span>
          )}
          <span>
            <a
              href={`https://github.com/${props.login}`}
              aria-label={`${props.login}'s GitHub profile`}
              class={LINK_STYLES}
              target="_blank"
            >
              <IconBrandGithub class="text-sm w-6" />
            </a>
          </span>
        </div>
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
      <main class="flex-1 p-4">
        <Profile
          isSubscribed={user.isSubscribed}
          login={user.login}
        />
        <ItemsList
          endpoint={`/api/users/${login}/items`}
          isSignedIn={isSignedIn}
        />
      </main>
    </>
  );
}
