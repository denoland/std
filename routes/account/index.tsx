// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import Layout from "@/components/Layout.tsx";
import type { AccountState } from "./_middleware.ts";
import { BUTTON_STYLES, NOTICE_STYLES } from "@/utils/constants.ts";
import { getOrCreateUser, getUserDisplayName, type User } from "@/utils/db.ts";
import { ComponentChild } from "preact";

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

interface RowProps {
  title: string;
  children?: ComponentChild;
  text: string;
}

function Row(props: RowProps) {
  return (
    <li class="py-4">
      <div class="flex flex-wrap justify-between">
        <span>
          <strong>{props.title}</strong>
        </span>
        {props.children && <span>{props.children}</span>}
      </div>
      <p>
        {props.text}
      </p>
    </li>
  );
}

export default function AccountPage(props: PageProps<AccountPageData>) {
  const action = props.data.user.isSubscribed ? "Manage" : "Upgrade";
  const hasResetPassword = new URL(props.url).searchParams.get(
    "has_reset_password",
  );

  return (
    <>
      <Head title="Account" href={props.url.href} />
      <Layout session={props.data.session}>
        <div class="max-w-lg m-auto w-full flex-1 p-4 flex flex-col justify-center">
          <h1 class="text-3xl mb-4">
            <strong>Account</strong>
          </h1>
          {hasResetPassword && (
            <div class={`${NOTICE_STYLES} mb-4`}>
              Your password has successfully been reset
            </div>
          )}
          <ul>
            <Row
              title="Display name"
              text={getUserDisplayName(props.data.user)}
            >
              <a href="/account/display-name" class="underline">Edit</a>
            </Row>
            <Row title="Email" text={props.data.session!.user.email!} />
            <Row
              title="Subscription"
              text={props.data.user.isSubscribed ? "Premium 🦕" : "Free"}
            >
              <a
                class="underline"
                href={`/account/${action.toLowerCase()}`}
              >
                {action}
              </a>
            </Row>
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
