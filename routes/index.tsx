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
  getVotesByUser,
  type Item,
  type Vote,
} from "@/utils/db.ts";

interface HomePageData extends State {
  items: Item[];
  commentsCounts: number[];
  votes: Vote[];
}

export const handler: Handlers<HomePageData, State> = {
  async GET(_req, ctx) {
    const items = await getAllItems();
    const score = (a: Item, b: Item) => {
      const x = a.score;
      const y = b.score;
      if (x > y) {
          return -1;
      }
      if (x < y) {
          return 1;
      }
      return 0;
  };
    const commentsCounts = await Promise.all(
      items.map((item) => getItemCommentsCount(item.id)),
    );
    items.sort(score);
    const votes = await getVotesByUser(ctx.state.session?.user.id);
    return ctx.render({ ...ctx.state, items, commentsCounts, votes });
  },
};

export default function HomePage(props: PageProps<HomePageData>) {
  return (
    <>
      <Head />
      <Layout isLoggedIn={props.data.isLoggedIn}>
        <div class={`${SITE_WIDTH_STYLES} divide-y flex-1 px-8`}>
          {props.data.items.map((item, index) => (
            <ItemSummary
              item={item}
              commentsCount={props.data.commentsCounts[index]}
              votes={props.data.votes}
              curUserId={props.data.session?.user.id}
            />
          ))}
        </div>
      </Layout>
    </>
  );
}
