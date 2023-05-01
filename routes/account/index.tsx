// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import Layout from "@/components/Layout.tsx";
import type { AccountState } from "./_middleware.ts";
import { BUTTON_STYLES } from "@/utils/constants.ts";
import { getUser, type UserValue } from "@/utils/db.ts";
import { NOTICE_STYLES } from "@/utils/constants.ts";

interface AccountPageData extends AccountState {
  user: UserValue;
}

export const handler: Handlers<AccountPageData, AccountState> = {
  async GET(_request, ctx) {
    const user = await getUser(ctx.state.session.user.id);
    return ctx.render({ ...ctx.state, user: user.value! });
  },
};

export default function AccountPage(props: PageProps<AccountPageData>) {
  const action = props.data.user.isSubscribed ? "Manage" : "Upgrade";
  const hasResetPassword = new URL(props.url).searchParams.get(
    "has_reset_password",
  );

  return (
    <>
      <Head title="Account" />
      <Layout isLoggedIn={props.data.isLoggedIn}>
        <div class="max-w-lg m-auto w-full flex-1 p-8 flex flex-col justify-center">
          <h1 class="text-3xl mb-4">
            <strong>Account</strong>
          </h1>
          {hasResetPassword && (
            <div class={NOTICE_STYLES}>
              Your password has successfully been reset
            </div>
          )}
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
