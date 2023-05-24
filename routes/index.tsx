// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import type { State } from "./_middleware.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import {
  getAllItems,
  getUserBySessionId,
  getUsersByIds,
  getVotedItemIdsByUser,
  type Item,
  type User,
} from "@/utils/db.ts";

interface HomePageData extends State {
  users: User[];
  items: Item[];
  cursor?: string;
  areVoted: boolean[];
}

export function compareScore(a: Item, b: Item) {
  const x = Number(a.score);
  const y = Number(b.score);
  if (x > y) {
    return -1;
  }
  if (x < y) {
    return 1;
  }
  return 0;
}

export const handler: Handlers<HomePageData, State> = {
  async GET(req, ctx) {
    /** @todo Add pagination functionality */
    const start = new URL(req.url).searchParams.get("page") || undefined;
    const { items, cursor } = await getAllItems({ limit: 10, cursor: start });
    items.sort(compareScore);
    const users = await getUsersByIds(items.map((item) => item.userId));
    let votedItemIds: string[] = [];
    if (ctx.state.sessionId) {
      const sessionUser = await getUserBySessionId(ctx.state.sessionId!);
      if (sessionUser) {
        votedItemIds = await getVotedItemIdsByUser(sessionUser!.id);
      }
    }
    /** @todo Optimise */
    const areVoted = items.map((item) => votedItemIds.includes(item.id));
    return ctx.render({ ...ctx.state, items, cursor, users, areVoted });
  },
};

export default function HomePage(props: PageProps<HomePageData>) {
  const nextPageUrl = new URL(props.url);
  nextPageUrl.searchParams.set("page", props.data.cursor || "");
  return (
    <>
      <Head href={props.url.href} />
      <Layout session={props.data.sessionId}>
        <div class={`${SITE_WIDTH_STYLES} flex-1 px-4`}>
          {props.data.items.map((item, index) => (
            <ItemSummary
              item={item}
              isVoted={props.data.areVoted[index]}
              user={props.data.users[index]}
            />
          ))}
          {props.data?.cursor && (
            <div class="mt-4 text-gray-500">
              <a href={nextPageUrl.toString()}>More</a>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
