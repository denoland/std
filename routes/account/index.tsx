// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { defineRoute } from "$fresh/server.ts";
import type { SignedInState } from "@/plugins/session.ts";
import { BUTTON_STYLES, LINK_STYLES } from "@/utils/constants.ts";
import { isStripeEnabled } from "@/utils/stripe.ts";
import Head from "@/components/Head.tsx";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";
import { PremiumBadge } from "@/components/PremiumBadge.tsx";

export default defineRoute<SignedInState>((_req, ctx) => {
  const { sessionUser } = ctx.state;
  const action = sessionUser.isSubscribed ? "Manage" : "Upgrade";

  return (
    <>
      <Head title="Account" href={ctx.url.href} />
      <main class="max-w-lg m-auto w-full flex-1 p-4 flex flex-col justify-center gap-8">
        <GitHubAvatarImg
          login={sessionUser.login}
          size={240}
          class="mx-auto"
        />
        <ul class="space-y-4">
          <li>
            <strong>Username</strong>
            <p class="flex flex-wrap justify-between">
              <span>
                {sessionUser.login}
              </span>
              <a href={`/users/${sessionUser.login}`} class={LINK_STYLES}>
                Go to my profile &#8250;
              </a>
            </p>
          </li>
          <li>
            <strong>Subscription</strong>
            <p class="flex flex-wrap justify-between">
              <span>
                {sessionUser.isSubscribed
                  ? (
                    <>
                      Premium <PremiumBadge class="w-5 h-5 inline" />
                    </>
                  )
                  : "Free"}
              </span>
              {isStripeEnabled() && (
                <span>
                  <a
                    class={LINK_STYLES}
                    href={`/account/${action.toLowerCase()}`}
                  >
                    {action} &#8250;
                  </a>
                </span>
              )}
            </p>
          </li>
        </ul>
        <a
          href="/signout?success_url=/"
          class={`${BUTTON_STYLES} block text-center`}
        >
          Sign out
        </a>
      </main>
    </>
  );
});
