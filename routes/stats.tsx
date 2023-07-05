// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { DAY } from "std/datetime/constants.ts";
import type { State } from "./_middleware.ts";
import Chart from "@/islands/Chart.tsx";
import { getDatesSince, getManyMetrics } from "@/utils/db.ts";

interface StatsPageData extends State {
  dates: Date[];
  visitsCounts: number[];
  usersCounts: number[];
  itemsCounts: number[];
  votesCounts: number[];
}

export const handler: Handlers<StatsPageData, State> = {
  async GET(_req, ctx) {
    ctx.state.title = "Stats";

    const msAgo = 30 * DAY;
    const dates = getDatesSince(msAgo).map((date) => new Date(date));

    const [
      visitsCounts,
      usersCounts,
      itemsCounts,
      votesCounts,
    ] = await Promise.all([
      getManyMetrics("visits_count", dates),
      getManyMetrics("users_count", dates),
      getManyMetrics("items_count", dates),
      getManyMetrics("votes_count", dates),
    ]);

    return ctx.render({
      ...ctx.state,
      dates,
      visitsCounts: visitsCounts.map(Number),
      usersCounts: usersCounts.map(Number),
      itemsCounts: itemsCounts.map(Number),
      votesCounts: votesCounts.map(Number),
    });
  },
};

export default function StatsPage(props: PageProps<StatsPageData>) {
  const datasets = [
    {
      label: "Site visits",
      data: props.data.visitsCounts,
      borderColor: "#be185d",
    },
    {
      label: "Users created",
      data: props.data.usersCounts,
      borderColor: "#e85d04",
    },
    {
      label: "Items created",
      data: props.data.itemsCounts,
      borderColor: "#219ebc",
    },
    {
      label: "Votes",
      data: props.data.votesCounts,
      borderColor: "#4338ca",
    },
  ];

  const max = Math.max(...datasets[0].data);

  const labels = props.data.dates.map((date) =>
    new Date(date).toLocaleDateString("en-us", {
      month: "short",
      day: "numeric",
    })
  );

  return (
    <main class="flex-1 p-4 flex flex-col">
      <h1 class="text-3xl font-bold">Stats</h1>
      <div class="flex-1 relative">
        <Chart
          type="line"
          options={{
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: "index",
            },
            scales: {
              x: {
                max,
                grid: { display: false },
              },
              y: {
                beginAtZero: true,
                grid: { display: false },
                ticks: { precision: 0 },
              },
            },
          }}
          data={{
            labels,
            datasets: datasets.map((dataset) => ({
              ...dataset,
              pointRadius: 0,
              cubicInterpolationMode: "monotone",
            })),
          }}
        />
      </div>
    </main>
  );
}
