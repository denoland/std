// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import type { State } from "./_middleware.ts";
import { getAllVisitsPerDay } from "@/utils/db.ts";
import { Chart } from "fresh_charts/mod.ts";
import { ChartColors } from "fresh_charts/utils.ts";

interface StatsPageData extends State {
  visits?: number[];
  dates?: string[];
}

export const handler: Handlers<StatsPageData, State> = {
  async GET(_, ctx) {
    const daysBefore = 30;
    const { visits, dates } = await getAllVisitsPerDay({
      limit: daysBefore,
    });

    return ctx.render({ ...ctx.state, visits, dates });
  },
};

function LineChart(
  props: { title: string; x: string[]; y: number[] },
) {
  return (
    <>
      <h3 class="py-4 text-2xl font-bold">{props.title}</h3>
      <Chart
        type="line"
        options={{
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { grid: { display: false } },
            x: { grid: { display: false } },
          },
        }}
        data={{
          labels: props.x,
          datasets: [{
            label: props.title,
            data: props.y,
            borderColor: ChartColors.Blue,
            backgroundColor: ChartColors.Blue,
            borderWidth: 3,
            cubicInterpolationMode: "monotone",
            tension: 0.4,
          }],
        }}
      />
    </>
  );
}

export default function StatsPage(props: PageProps<StatsPageData>) {
  return (
    <>
      <Head title="Stats" href={props.url.href} />
      <Layout session={props.data.sessionId}>
        <div class={`${SITE_WIDTH_STYLES} flex-1 px-4`}>
          <div class="p-4 mx-auto max-w-screen-md">
            <LineChart
              title="Visits"
              x={props.data.dates!}
              y={props.data.visits!}
            />
          </div>
        </div>
      </Layout>
    </>
  );
}
