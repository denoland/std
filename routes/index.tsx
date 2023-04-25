// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { type SupabaseClient } from "@/utils/supabase.ts";
import { BASE_SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import type { State } from "./_middleware.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import type { Item } from "@/utils/item.ts";

export async function getItems(client: SupabaseClient) {
  return await client
    .from("items")
    .select(`
      *,
      comments(count)
    `)
    .throwOnError()
    .then(({ data }) => data) || [];
}

export const handler: Handlers<Item[], State> = {
  async GET(_req, ctx) {
    const items = await getItems(ctx.state.supabaseClient);
    return ctx.render(items);
  },
};

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
