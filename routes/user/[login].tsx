// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import { calcLastPage, calcPageNum, PAGE_LENGTH } from "@/utils/pagination.ts";
import PageSelector from "@/components/PageSelector.tsx";
import {
  compareScore,
  getAreVotedBySessionId,
  getItemsByUser,
  getUserByLogin,
  type Item,
  type User,
} from "@/utils/db.ts";
import { pluralize } from "@/utils/display.ts";
import { GitHub } from "@/components/Icons.tsx";
import { LINK_STYLES } from "@/utils/constants.ts";
import Head from "@/components/Head.tsx";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";

export interface UserData extends State {
  user: User;
  items: Item[];
  areVoted: boolean[];
  lastPage: number;
  itemsCount: number;
}

export const handler: Handlers<UserData, State> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const pageNum = calcPageNum(url);

    const user = await getUserByLogin(ctx.params.login);
    if (user === null) {
      return ctx.renderNotFound();
    }

    const allItems = await getItemsByUser(user.id);
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

    return ctx.render({
      ...ctx.state,
      user,
      items,
      areVoted,
      lastPage,
      itemsCount,
    });
  },
};

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
              <GitHub class="text-sm w-6" />
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

export default function UserPage(props: PageProps<UserData>) {
  return (
    <>
      <Head title={props.data.user.login} href={props.url.href} />
      <main class="flex-1 p-4">
        <Profile
          isSubscribed={props.data.user.isSubscribed}
          login={props.data.user.login}
          itemsCount={props.data.itemsCount}
        />
        {props.data.items.map((item, index) => (
          <ItemSummary
            item={item}
            isVoted={props.data.areVoted[index]}
            user={props.data.user}
          />
        ))}
        {props.data.lastPage > 1 && (
          <PageSelector
            currentPage={calcPageNum(props.url)}
            lastPage={props.data.lastPage}
          />
        )}
      </main>
    </>
  );
}
