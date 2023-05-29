// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import type { State } from "./_middleware.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import {
  compareScore,
  getAllItems,
  getUsersByIds,
  getVotedItemsBySessionUser,
  incrementVisitsPerDay,
  type Item,
  type User,
} from "@/utils/db.ts";

interface HomePageData extends State {
  users: User[];
  items: Item[];
  cursor?: string;
  areVoted: boolean[];
}

export const handler: Handlers<HomePageData, State> = {
  async GET(req, ctx) {
    /** @todo Add pagination functionality */
    const start = new URL(req.url).searchParams.get("page") || undefined;
    const { items, cursor } = await getAllItems({ limit: 10, cursor: start });
    items.sort(compareScore);
    const users = await getUsersByIds(items.map((item) => item.userId));
    await incrementVisitsPerDay(new Date());

    /** @todo (iuioiua): remove the need for `ctx.state.sessionId` */
    const areVoted = await getVotedItemsBySessionUser(
      items,
      ctx.state.sessionId,
    );
    return ctx.render({ ...ctx.state, items, cursor, users, areVoted });
  },
};

export default function HomePage(props: PageProps<HomePageData>) {
  const nextPageUrl = new URL(props.url);
  nextPageUrl.searchParams.set("page", props.data.cursor || "");
  return (
    <>
      <Head href={props.url.href} />
      <Layout isSignedIn={props.data.isSignedIn}>
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
