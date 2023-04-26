// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import type { Database } from "@/utils/supabase_types.ts";
import Layout from "@/components/Layout.tsx";
import type { AccountState } from "./_middleware.ts";
import { BUTTON_STYLES } from "../../utils/constants.ts";

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
      <Layout isLoggedIn={props.data.isLoggedIn}>
        <div class="max-w-lg m-auto w-full flex-1 p-8 flex flex-col justify-center">
          <h1 class="text-3xl mb-4">
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
          <a
            href="/logout"
            class={`${BUTTON_STYLES} block text-center mt-8`}
          >
            Logout
          </a>
        </div>
      </Layout>
    </>
  );
}
