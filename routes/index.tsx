// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import type { State } from "./_middleware.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import { getItems, type ItemValue } from "@/utils/db.ts";

interface HomePageData extends State {
  items: Deno.KvEntry<ItemValue>[];
}

export const handler: Handlers<HomePageData, State> = {
  async GET(_req, ctx) {
    const items = await getItems();
    return ctx.render({ ...ctx.state, items });
  },
};

export default function HomePage(props: PageProps<HomePageData>) {
  return (
    <>
      <Head />
      <Layout isLoggedIn={props.data.isLoggedIn}>
        <div class={`${SITE_WIDTH_STYLES} divide-y flex-1 px-8`}>
          {props.data.items.map((item) => <ItemSummary {...item} />)}
        </div>
      </Layout>
    </>
  );
}
