// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { DAY } from "std/datetime/constants.ts";
import type { State } from "./_middleware.ts";
import Chart from "@/islands/Chart.tsx";
import { getDatesSince, getManyMetrics } from "@/utils/db.ts";

interface StatsPageData extends State {
  dates: Date[];
  visitsCounts: bigint[];
  usersCounts: bigint[];
  itemsCounts: bigint[];
  votesCounts: bigint[];
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
      visitsCounts,
      usersCounts,
      itemsCounts,
      votesCounts,
    });
  },
};

export default function StatsPage(props: PageProps<StatsPageData>) {
  const charts = [
    {
      title: "Site visits",
      values: props.data.visitsCounts,
      color: "#be185d",
    },
    {
      title: "Users created",
      values: props.data.usersCounts,
      color: "#e85d04",
    },
    {
      title: "Items created",
      values: props.data.itemsCounts,
      color: "#219ebc",
    },
    {
      title: "Votes",
      values: props.data.votesCounts,
      color: "#4338ca",
    },
  ];

  const x = props.data.dates.map((date) =>
    new Date(date).toLocaleDateString("en-us", {
      month: "short",
      day: "numeric",
    })
  );

  return (
    <main class="flex-1 p-4 grid gap-12 md:grid-cols-2">
      {charts.map(({ color, title, values }) => {
        const data = values.map((value) => Number(value));
        const total = data.reduce(
          (value, currentValue) => currentValue + value,
          0,
        );

        return (
          <div class="py-4">
            <div class="text-center">
              <h3>{title}</h3>
              <p class="font-bold">{total}</p>
            </div>
            <Chart
              container={{
                class: "aspect-[2/1] mx-auto relative max-w-[100vw]",
              }}
              type="line"
              options={{
                plugins: {
                  legend: { display: false },
                },
                interaction: {
                  intersect: false,
                },
                scales: {
                  x: {
                    grid: { display: false },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { display: false },
                    max: Math.ceil(Math.max(...data) * 1.1),
                    ticks: { stepSize: 1 },
                  },
                },
              }}
              data={{
                labels: x,
                datasets: [{
                  label: title,
                  data,
                  borderColor: color,
                  pointRadius: 0,
                  cubicInterpolationMode: "monotone",
                }],
              }}
            />
          </div>
        );
      })}
    </main>
  );
}
