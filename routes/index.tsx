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
import { getToggledStyles } from "@/utils/display.ts";
import { ACTIVE_LINK_STYLES, LINK_STYLES } from "@/utils/constants.ts";

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
    <div class="flex justify-center my-4 gap-8">
      {/* These links do not preserve current URL queries. E.g. if ?page=2, that'll be removed once one of these links is clicked */}
      <a
        class={getToggledStyles(
          LINK_STYLES,
          ACTIVE_LINK_STYLES,
          timeAgo === null || timeAgo === "week",
        )}
        href="/?time-ago=week"
      >
        Last Week
      </a>
      <a
        class={getToggledStyles(
          LINK_STYLES,
          ACTIVE_LINK_STYLES,
          timeAgo === "month",
        )}
        href="/?time-ago=month"
      >
        Last Month
      </a>
      <a
        class={getToggledStyles(
          LINK_STYLES,
          ACTIVE_LINK_STYLES,
          timeAgo === "all",
        )}
        href="/?time-ago=all"
      >
        All time
      </a>
    </div>
  );
}

export default function HomePage(props: PageProps<HomePageData>) {
  return (
    <main class="flex-1 p-4">
      <TimeSelector url={props.url} />
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
  );
}
