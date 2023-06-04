// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import type { State } from "./_middleware.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import {
  compareScore,
  getAllItemsInPastWeek,
  getAreVotedBySessionId,
  getManyUsers,
  incrementAnalyticsMetricPerDay,
  type Item,
  type User,
} from "@/utils/db.ts";

const PAGE_LENGTH = 10;

interface HomePageData extends State {
  itemsUsers: User[];
  items: Item[];
  lastPage: number;
  areVoted: boolean[];
}

function calcPageNum(url: URL) {
  return parseInt(url.searchParams.get("page") || "1");
}

function calcLastPage(total = 0, pageLength = PAGE_LENGTH): number {
  return Math.ceil(total / pageLength);
}

export const handler: Handlers<HomePageData, State> = {
  async GET(req, ctx) {
    await incrementAnalyticsMetricPerDay("visits_count", new Date());

    const pageNum = calcPageNum(new URL(req.url));
    const allItems = await getAllItemsInPastWeek();
    const items = allItems
      .toSorted(compareScore)
      .slice((pageNum - 1) * PAGE_LENGTH, pageNum * PAGE_LENGTH);

    const itemsUsers = await getManyUsers(items.map((item) => item.userId));

    const areVoted = await getAreVotedBySessionId(
      items,
      ctx.state.sessionId,
    );
    const lastPage = calcLastPage(allItems.length, PAGE_LENGTH);

    return ctx.render({ ...ctx.state, items, itemsUsers, areVoted, lastPage });
  },
};

function PageSelector(props: { currentPage: number; lastPage: number }) {
  return (
    <div class="flex justify-center py-4 mx-auto">
      <form class="inline-flex items-center gap-x-2">
        <input
          id="current_page"
          class={`bg-white rounded rounded-lg outline-none w-full border-1 border-gray-300 hover:border-black transition duration-300 disabled:(opacity-50 cursor-not-allowed) rounded-md px-2 py-1`}
          type="number"
          name="page"
          min="1"
          max={props.lastPage}
          value={props.currentPage}
          // @ts-ignore: this is valid HTML
          onchange="this.form.submit()"
        />
        <label for="current_page" class="whitespace-nowrap align-middle">
          of {props.lastPage}
        </label>
      </form>
    </div>
  );
}

export default function HomePage(props: PageProps<HomePageData>) {
  return (
    <>
      <Head href={props.url.href} />
      <Layout session={props.data.sessionId}>
        <div class={`${SITE_WIDTH_STYLES} flex-1 px-4`}>
          {props.data.items.map((item, index) => (
            <ItemSummary
              item={item}
              isVoted={props.data.areVoted[index]}
              user={props.data.itemsUsers[index]}
            />
          ))}
          {props.data.lastPage > 1 && (
            <PageSelector
              currentPage={calcPageNum(props.url)}
              lastPage={props.data.lastPage}
            />
          )}
        </div>
      </Layout>
    </>
  );
}
