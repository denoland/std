// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { ComponentChild } from "preact";
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

export interface UserData extends State {
  user: User;
  items: Item[];
  areVoted: boolean[];
  lastPage: number;
  itemsCount: number;
}

export const handler: Handlers<UserData, State> = {
  async GET(req, ctx) {
    const { username } = ctx.params;
    const url = new URL(req.url);
    const pageNum = calcPageNum(url);

    const user = await getUserByLogin(username);
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

    ctx.state.title = user.login;

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

interface RowProps {
  title: string;
  children?: ComponentChild;
  text: string;
  img?: string;
}

function Row(props: RowProps) {
  return (
    <div class="flex flex-wrap py-8">
      {props.img && (
        <img
          height="48"
          width="48"
          src={props.img}
          alt="user avatar"
          class="rounded-full"
        />
      )}
      <div class="px-4">
        <div class="flex flex-wrap justify-between">
          <span>
            <strong>{props.title}</strong>
          </span>
          {props.children && <span>{props.children}</span>}
        </div>
        <p>
          {props.text}
        </p>
      </div>
    </div>
  );
}

export default function UserPage(props: PageProps<UserData>) {
  return (
    <main class="flex-1 p-4">
      <Row
        title={props.data.user.login}
        text={pluralize(props.data.itemsCount, "submission")}
        img={props.data.user.avatarUrl}
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
  );
}
