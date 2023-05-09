// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import Layout from "@/components/Layout.tsx";
import type { AccountState } from "./_middleware.ts";
import { BUTTON_STYLES, NOTICE_STYLES } from "@/utils/constants.ts";
import { getOrCreateUser, getUserDisplayName, type User } from "@/utils/db.ts";

interface AccountPageData extends AccountState {
  user: User;
}

export const handler: Handlers<AccountPageData, AccountState> = {
  async GET(_request, ctx) {
    const user = await getOrCreateUser(
      ctx.state.session.user.id,
      ctx.state.session.user.email!,
    );
    return user ? ctx.render({ ...ctx.state, user }) : ctx.renderNotFound();
  },
};

export default function AccountPage(props: PageProps<AccountPageData>) {
  const action = props.data.user.isSubscribed ? "Manage" : "Upgrade";
  const hasResetPassword = new URL(props.url).searchParams.get(
    "has_reset_password",
  );

  return (
    <>
      <Head title="Account" href={props.url.href} />
      <Layout session={props.data.session}>
        <div class="max-w-lg m-auto w-full flex-1 p-8 flex flex-col justify-center">
          <h1 class="text-3xl mb-4">
            <strong>Account</strong>
          </h1>
          {hasResetPassword && (
            <div class={NOTICE_STYLES}>
              Your password has successfully been reset
            </div>
          )}
          <ul>
            <li class="py-4">
              <p>
                <strong>Display name</strong>
              </p>
              <p>
                {getUserDisplayName(props.data.user)}
              </p>
              <p>
                <a href="/account/display-name" class="underline">Edit</a>
              </p>
            </li>
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
