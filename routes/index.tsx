// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { createSupabaseClient, type SupabaseClient } from "@/utils/supabase.ts";
import { BASE_SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import type { Database } from "@/utils/supabase_types.ts";

type Item = Database["public"]["Tables"]["items"]["Row"];

export async function getItems(client: SupabaseClient) {
  return await client
    .from("items")
    .select()
    .throwOnError()
    .then(({ data }) => data) || [];
}

export const handler: Handlers<Item[]> = {
  async GET(req, ctx) {
    const supabaseClient = createSupabaseClient(req.headers);
    const items = await getItems(supabaseClient);

    return ctx.render(items);
  },
};

export function pluralize(unit: number, label: string) {
  return unit === 1 ? `${unit} ${label}` : `${unit} ${label}s`;
}

/** @todo Replace with https://deno.land/std@0.184.0/datetime/mod.ts?s=difference */
export function timeAgo(time: number | Date) {
  const between = Date.now() / 1000 - Number(time);
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
    <div class={`${BASE_SITE_WIDTH_STYLES} divide-y flex-1 px-8`}>
      {props.items.map((item) => <ItemSummary {...item} />)}
    </div>
  );
}

export default function HomePage(props: PageProps<Item[]>) {
  return (
    <>
      <Head />
      <Layout>
        <ItemList items={props.data} />
      </Layout>
    </>
  );
}
