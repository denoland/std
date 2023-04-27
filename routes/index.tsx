// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { type SupabaseClient } from "@/utils/supabase.ts";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import type { State } from "./_middleware.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import type { Item } from "@/utils/item.ts";

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
