// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import type { State } from "./_middleware.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import {
  getAllItems,
  getItemCommentsCount,
  getUsersByIds,
  getVotedItemIdsByUser,
  type Item,
  type User,
} from "@/utils/db.ts";

interface HomePageData extends State {
  users: User[];
  items: Item[];
  commentsCounts: number[];
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
  async GET(_req, ctx) {
    /** @todo Add pagination functionality */
    const items = (await getAllItems({ limit: 10 })).sort(compareScore);
    const users = await getUsersByIds(items.map((item) => item.userId));
    const commentsCounts = await Promise.all(
      items.map((item) => getItemCommentsCount(item.id)),
    );
    const votedItemIds = ctx.state.session
      ? await getVotedItemIdsByUser(ctx.state.session?.user.id)
      : [];
    /** @todo Optimise */
    const areVoted = items.map((item) => votedItemIds.includes(item.id));
    return ctx.render({ ...ctx.state, items, commentsCounts, users, areVoted });
  },
};

export default function HomePage(props: PageProps<HomePageData>) {
  return (
    <>
      <Head />
      <Layout session={props.data.session}>
        <div class={`${SITE_WIDTH_STYLES} flex-1 px-8`}>
          {props.data.items.map((item, index) => (
            <ItemSummary
              item={item}
              commentsCount={props.data.commentsCounts[index]}
              isVoted={props.data.areVoted[index]}
              user={props.data.users[index]}
            />
          ))}
        </div>
      </Layout>
    </>
  );
}
