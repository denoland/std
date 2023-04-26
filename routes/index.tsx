// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { type SupabaseClient } from "@/utils/supabase.ts";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import type { Database } from "@/utils/supabase_types.ts";
import type { State } from "./_middleware.ts";

type Item = Database["public"]["Tables"]["items"]["Row"];
interface HomePageData extends State {
  items: Item[];
}

export async function getItems(client: SupabaseClient) {
  return await client
    .from("items")
    .select()
    .throwOnError()
    .then(({ data }) => data) || [];
}

export const handler: Handlers<HomePageData, State> = {
  async GET(_req, ctx) {
    const items = await getItems(ctx.state.supabaseClient);
    return ctx.render({ ...ctx.state, items });
  },
};

export function pluralize(unit: number, label: string) {
  return unit === 1 ? `${unit} ${label}` : `${unit} ${label}s`;
}

/** @todo Replace with https://deno.land/std@0.184.0/datetime/mod.ts?s=difference */
export function timeAgo(time: number | Date) {
  const between = (Date.now() - Number(time)) / 1000;
  if (between < 3600) return pluralize(~~(between / 60), "minute");
  else if (between < 86400) return pluralize(~~(between / 3600), "hour");
  else return pluralize(~~(between / 86400), "day");
}

export function ItemSummary(props: Item) {
  return (
    <div class="py-2">
      <div>
        <span class="cursor-pointer mr-2 text-gray-300">▲</span>
        <span class="mr-2">
          <a href={props.url}>{props.title}</a>
        </span>
        <span class="text-gray-500">
          {new URL(props.url).host}
        </span>
      </div>
      <div class="text-gray-500">
        {pluralize(props.score, "point")} by {props.author_id}{" "}
        {timeAgo(new Date(props.created_at!))} ago
      </div>
    </div>
  );
}

export interface ItemListProps {
  items: Item[];
}

export function ItemList(props: ItemListProps) {
  return (
    <div class={`${SITE_WIDTH_STYLES} divide-y flex-1 px-8`}>
      {props.items.map((item) => <ItemSummary {...item} />)}
    </div>
  );
}

export default function HomePage(props: PageProps<HomePageData>) {
  return (
    <>
      <Head />
      <Layout isLoggedIn={props.data.isLoggedIn}>
        <ItemList items={props.data.items} />
      </Layout>
    </>
  );
}
