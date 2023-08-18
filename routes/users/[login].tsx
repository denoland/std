// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import { calcLastPage, calcPageNum, PAGE_LENGTH } from "@/utils/pagination.ts";
import PageSelector from "@/components/PageSelector.tsx";
import {
  compareScore,
  getAreVotedBySessionId,
  getItemsByUser,
  getUser,
} from "@/utils/db.ts";
import { pluralize } from "@/utils/display.ts";
import IconBrandGithub from "tabler_icons_tsx/brand-github.tsx";
import { LINK_STYLES } from "@/utils/constants.ts";
import Head from "@/components/Head.tsx";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";

function Profile(
  props: { login: string; itemsCount: number; isSubscribed: boolean },
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
        <p>
          {pluralize(props.itemsCount, "submission")}
        </p>
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

  const pageNum = calcPageNum(ctx.url);

  const allItems = await getItemsByUser(login);
  const itemsCount = allItems.length;

  const items = allItems.sort(compareScore).slice(
    (pageNum - 1) * PAGE_LENGTH,
    pageNum * PAGE_LENGTH,
  );

  const areVoted = await getAreVotedBySessionId(
    items,
    ctx.state.sessionId,
  );

  const lastPage = calcLastPage(allItems.length, PAGE_LENGTH);

  return (
    <>
      <Head title={user.login} href={ctx.url.href} />
      <main class="flex-1 p-4">
        <Profile
          isSubscribed={user.isSubscribed}
          login={user.login}
          itemsCount={itemsCount}
        />
        {items.map((item, index) => (
          <ItemSummary
            item={item}
            isVoted={areVoted[index]}
          />
        ))}
        {lastPage > 1 && (
          <PageSelector
            currentPage={calcPageNum(ctx.url)}
            lastPage={lastPage}
          />
        )}
      </main>
    </>
  );
}
