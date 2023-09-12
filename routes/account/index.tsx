// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { PageProps } from "$fresh/server.ts";
import type { SignedInState } from "@/middleware/session.ts";
import { BUTTON_STYLES } from "@/utils/constants.ts";
import { isStripeEnabled } from "@/utils/stripe.ts";
import Head from "@/components/Head.tsx";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";

export default function AccountPage(
  props: PageProps<undefined, SignedInState>,
) {
  const { sessionUser } = props.state;
  const action = sessionUser.isSubscribed ? "Manage" : "Upgrade";

  return (
    <>
      <Head title="Account" href={props.url.href} />
      <main class="max-w-lg m-auto w-full flex-1 p-4 flex flex-col justify-center">
        <GitHubAvatarImg
          login={sessionUser.login}
          size={240}
          class="m-auto"
        />
        <ul>
          <li class="py-4">
            <p>
              <strong>Username</strong>
            </p>
            <p>
              {sessionUser.login}
            </p>
          </li>
          <li class="py-4">
            <p class="flex flex-wrap justify-between">
              <span>
                <strong>Subscription</strong>
              </span>
              {isStripeEnabled() && (
                <span>
                  <a
                    class="underline"
                    href={`/account/${action.toLowerCase()}`}
                  >
                    {action}
                  </a>
                </span>
              )}
            </p>
            <p>
              {sessionUser.isSubscribed ? "Premium 🦕" : "Free"}
            </p>
          </li>
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
