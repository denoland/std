// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import { DAY } from "std/datetime/constants.ts";
import Chart from "@/islands/Chart.tsx";
import { getDatesSince, getManyMetrics } from "@/utils/db.ts";
import Head from "@/components/Head.tsx";
import TabsBar from "@/components/TabsBar.tsx";
import { HEADING_WITH_MARGIN_STYLES } from "@/utils/constants.ts";

export default async function DashboardStatsPage(
  _req: Request,
  ctx: RouteContext,
) {
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

  const datasets = [
    {
      label: "Site visits",
      data: visitsCounts.map(Number),
      borderColor: "#be185d",
    },
    {
      label: "Users created",
      data: usersCounts.map(Number),
      borderColor: "#e85d04",
    },
    {
      label: "Items created",
      data: itemsCounts.map(Number),
      borderColor: "#219ebc",
    },
    {
      label: "Votes",
      data: votesCounts.map(Number),
      borderColor: "#4338ca",
    },
  ];

  const max = Math.max(...datasets[0].data);

  const labels = dates.map((date) =>
    new Date(date).toLocaleDateString("en-us", {
      month: "short",
      day: "numeric",
    })
  );

  return (
    <>
      <Head title="Dashboard" href={ctx.url.href} />
      <main class="flex-1 p-4 flex flex-col">
        <h1 class={HEADING_WITH_MARGIN_STYLES}>Dashboard</h1>
        <TabsBar
          links={[{
            path: "/dashboard/stats",
            innerText: "Stats",
          }, {
            path: "/dashboard/users",
            innerText: "Users",
          }]}
          currentPath={ctx.url.pathname}
        />
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
    </>
  );
}
