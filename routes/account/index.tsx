// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import type { Database } from "@/utils/supabase_types.ts";
import Layout from "@/components/Layout.tsx";
import type { AccountState } from "./_middleware.ts";
import { BASE_SITE_WIDTH_STYLES } from "../../utils/constants.ts";

interface AccountPageData extends AccountState {
  customer: Database["public"]["Tables"]["customers"]["Row"];
}

export const handler: Handlers<AccountPageData, AccountState> = {
  async GET(_request, ctx) {
    const customer = await ctx.state.createOrGetCustomer();
    return ctx.render({ ...ctx.state, customer });
  },
};

export default function AccountPage(props: PageProps<AccountPageData>) {
  const action = props.data.customer.is_subscribed ? "Manage" : "Upgrade";

  return (
    <>
      <Head title="Account" />
      <Layout>
        <div class={`${BASE_SITE_WIDTH_STYLES} flex-1 px-8`}>
          <ul class="space-y-2">
            <li class="flex items-center justify-between gap-2 py-2">
              <div class="flex-1">
                <strong>Email</strong>
              </div>
              <div>{props.data.session!.user.email}</div>
            </li>
            <li class="flex items-center justify-between gap-2 py-2">
              <div class="flex-1">
                <strong>Subscription</strong>
              </div>
              <a class="underline" href={`/account/${action.toLowerCase()}`}>
                {action} subscription
              </a>
            </li>
          </ul>
        </div>
      </Layout>
    </>
  );
}
