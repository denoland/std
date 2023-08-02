// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { calcLastPage, calcPageNum, PAGE_LENGTH } from "@/utils/pagination.ts";
import type { State } from "./_middleware.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import PageSelector from "@/components/PageSelector.tsx";
import {
  compareScore,
  getAllItems,
  getAreVotedBySessionId,
  getItemsSince,
  getManyUsers,
  type Item,
  type User,
} from "@/utils/db.ts";
import { DAY, WEEK } from "std/datetime/constants.ts";
import Head from "@/components/Head.tsx";
import { Info } from "@/components/Icons.tsx";
import { TabItem } from "@/components/TabsBar.tsx";

interface HomePageData extends State {
  itemsUsers: User[];
  items: Item[];
  lastPage: number;
  areVoted: boolean[];
}

function calcTimeAgoFilter(url: URL) {
  return url.searchParams.get("time-ago");
}

export const handler: Handlers<HomePageData, State> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const pageNum = calcPageNum(url);
    const timeAgo = calcTimeAgoFilter(url);
    let allItems: Item[];
    if (timeAgo === "week" || timeAgo === null) {
      allItems = await getItemsSince(WEEK);
    } else if (timeAgo === "month") {
      allItems = await getItemsSince(30 * DAY);
    } else {
      allItems = await getAllItems();
    }

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

function TimeSelector(props: { url: URL }) {
  const timeAgo = props.url.searchParams.get("time-ago");
  return (
    <div class="flex justify-center my-4 gap-2">
      {/* These links do not preserve current URL queries. E.g. if ?page=2, that'll be removed once one of these links is clicked */}
      <TabItem
        path="/?time-ago=week"
        innerText="Last Week"
        active={timeAgo === null || timeAgo === "week"}
      />
      <TabItem
        path="/?time-ago=month"
        innerText="Last Month"
        active={timeAgo === "month"}
      />
      <TabItem
        path="/?time-ago=all"
        innerText="All time"
        active={timeAgo === "all"}
      />
    </div>
  );
}

export default function HomePage(props: PageProps<HomePageData>) {
  return (
    <>
      <Head href={props.url.href} />
      <main class="flex-1 p-4">
        <TimeSelector url={props.url} />
        {props.data.items.length === 0 && (
          <>
            <div class="flex flex-col justify-center items-center gap-2">
              <div class="flex flex-col items-center gap-2 pt-16">
                <Info class="w-10 h-10 text-gray-400 dark:text-gray-600" />
                <p class="text-center font-medium">No items found</p>
              </div>

              <a
                href="/submit"
                class="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-primary hover:underline"
              >
                Submit your project
              </a>
            </div>
          </>
        )}

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
            timeSelector={calcTimeAgoFilter(props.url) ?? undefined}
          />
        )}
      </main>
    </>
  );
}
