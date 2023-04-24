// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import type { Database } from "@/utils/supabase_types.ts";
import Layout from "@/components/Layout.tsx";
import type { AccountState } from "./_middleware.ts";

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
        <div class="max-w-lg m-auto w-full flex-1 px-8 pt-32 pb-8">
          <h1 class="text-2xl mb-4">
            <strong>Account</strong>
          </h1>
          <ul class="divide-y">
            <li class="py-4">
              <p>
                <strong>Email</strong>
              </p>
              <p>
                {props.data.session!.user.email}
              </p>
            </li>
            <li class="py-4">
              <p>
                <strong>Subscription</strong>
              </p>
              <p>
                <a class="underline" href={`/account/${action.toLowerCase()}`}>
                  {action} subscription
                </a>
              </p>
            </li>
          </ul>
        </div>
      </Layout>
    </>
  );
}
