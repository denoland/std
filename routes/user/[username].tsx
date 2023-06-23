// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import { ComponentChild } from "preact";
import type { State } from "@/routes/_middleware.ts";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
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
}

export const handler: Handlers<UserData, State> = {
  async GET(_request, ctx) {
    const { username } = ctx.params;

    const user = await getUserByLogin(username);
    if (user === null) {
      return ctx.renderNotFound();
    }

    const items = await getItemsByUser(user.id);
    items.sort(compareScore);
    const areVoted = await getAreVotedBySessionId(
      items,
      ctx.state.sessionId,
    );

    return ctx.render({ ...ctx.state, user, items, areVoted });
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
    <>
      <Head title={props.data.user.login} href={props.url.href} />
      <div class={`${SITE_WIDTH_STYLES} flex-1 px-4`}>
        <Row
          title={props.data.user.login}
          text={pluralize(props.data.items.length, "submission")}
          img={props.data.user.avatarUrl}
        />
        {props.data.items.map((item, index) => (
          <ItemSummary
            item={item}
            isVoted={props.data.areVoted[index]}
            user={props.data.user}
          />
        ))}
      </div>
    </>
  );
}
