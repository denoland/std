// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import type { SignedInState } from "@/utils/middleware.ts";
import { BUTTON_STYLES } from "@/utils/constants.ts";
import { ComponentChild } from "preact";
import { stripe } from "@/utils/payments.ts";
import Head from "@/components/Head.tsx";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";

function Row(
  props: { title: string; children?: ComponentChild; text: string },
) {
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

// deno-lint-ignore require-await
export default async function AccountPage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  const { user } = ctx.state;
  const action = user.isSubscribed ? "Manage" : "Upgrade";

  return (
    <>
      <Head title="Account" href={ctx.url.href} />
      <main class="max-w-lg m-auto w-full flex-1 p-4 flex flex-col justify-center">
        <GitHubAvatarImg
          login={user.login}
          size={240}
          class="m-auto"
        />
        <ul>
          <Row
            title="Username"
            text={user.login}
          />
          <Row
            title="Subscription"
            text={user.isSubscribed ? "Premium 🦕" : "Free"}
          >
            {stripe && (
              <a
                class="underline"
                href={`/account/${action.toLowerCase()}`}
              >
                {action}
              </a>
            )}
          </Row>
        </ul>
        <a
          href="/signout?success_url=/"
          class={`${BUTTON_STYLES} block text-center mt-8`}
        >
          Sign out
        </a>
      </main>
    </>
  );
}
