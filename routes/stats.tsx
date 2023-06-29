// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import Head from "@/components/Head.tsx";
import type { State } from "./_middleware.ts";
import { getDatesSince, getManyMetrics } from "@/utils/db.ts";
import { Chart } from "fresh_charts/mod.ts";
import { ChartColors } from "fresh_charts/utils.ts";
import { DAY } from "std/datetime/constants.ts";

interface StatsPageData extends State {
  dates: Date[];
  visitsCounts: bigint[];
  usersCounts: bigint[];
  itemsCounts: bigint[];
  votesCounts: bigint[];
}

export const handler: Handlers<StatsPageData, State> = {
  async GET(_req, ctx) {
    const msAgo = 10 * DAY;
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

function LineChart(
  props: { title: string; x: string[]; y: bigint[] },
) {
  return (
    <div class="py-4 resize lg:chart">
      <h3 class="py-4 text-2xl font-bold">{props.title}</h3>
      <Chart
        width={550}
        height={300}
        type="line"
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { grid: { display: false }, beginAtZero: true },
            x: { grid: { display: false } },
          },
        }}
        data={{
          labels: props.x,
          datasets: [{
            label: props.title,
            data: props.y.map((value) => Number(value)),
            borderColor: ChartColors.Blue,
            backgroundColor: ChartColors.Blue,
            borderWidth: 3,
            cubicInterpolationMode: "monotone",
            tension: 0.4,
          }],
        }}
      />
    </div>
  );
}

export default function StatsPage(props: PageProps<StatsPageData>) {
  const x = props.data.dates.map((date) =>
    new Date(date).toLocaleDateString("en-us", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  );

  return (
    <>
      <Head title="Stats" href={props.url.href}>
        <style
          type="text/css"
          dangerouslySetInnerHTML={{
            __html: `
            .resize svg {
              width:100%;
            }`,
          }}
        />
      </Head>
      <div class={`${SITE_WIDTH_STYLES} flex-1 px-4`}>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <LineChart
            title="Visits"
            x={x}
            y={props.data.visitsCounts}
          />
          <LineChart
            title="Users"
            x={x}
            y={props.data.usersCounts}
          />
          <LineChart
            title="Items"
            x={x}
            y={props.data.itemsCounts}
          />
          <LineChart
            title="Votes"
            x={x}
            y={props.data.votesCounts}
          />
        </div>
      </div>
    </>
  );
}
