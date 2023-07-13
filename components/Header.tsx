// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  ACTIVE_LINK_STYLES,
  BUTTON_STYLES,
  LINK_STYLES,
  NAV_STYLES,
  SITE_BAR_STYLES,
  SITE_NAME,
} from "@/utils/constants.ts";
import { stripe } from "@/utils/payments.ts";
import { Bell, CircleFilled } from "./Icons.tsx";
import { getToggledStyles } from "@/utils/display.ts";

export default function Header(
  props: { sessionId?: string; hasNotifications: boolean; url: URL },
) {
  return (
    <header class={SITE_BAR_STYLES}>
      <a href="/">
        <img
          height="48"
          width="48"
          src="/logo.webp"
          alt={SITE_NAME + " logo"}
          class="h-12 w-12"
        />
      </a>
      <nav class={NAV_STYLES}>
        {stripe
          ? (
            <a
              href="/pricing"
              class={getToggledStyles(
                LINK_STYLES,
                ACTIVE_LINK_STYLES,
                props.url.pathname === "/pricing",
              )}
            >
              Pricing
            </a>
          )
          : null}
        {props.sessionId
          ? (
            <a
              href="/account"
              class={getToggledStyles(
                LINK_STYLES,
                ACTIVE_LINK_STYLES,
                props.url.pathname === "/account",
              )}
            >
              Account
            </a>
          )
          : <a href="/signin" class={LINK_STYLES}>Sign in</a>}
        <a
          href="/account/notifications"
          class={getToggledStyles(
            LINK_STYLES,
            ACTIVE_LINK_STYLES,
            props.url.pathname === "/account/notifications",
          ) + " relative"}
          aria-label="Notifications"
        >
          <Bell class="w-6 h-6" />
          {props.hasNotifications && (
            <CircleFilled class="absolute top-0.5 right-0.5 text-pink-700 w-2 h-2" />
          )}
        </a>
        <div class="rounded-lg bg-gradient-to-tr from-secondary to-primary p-px">
          <a
            href="/submit"
            class="text-white rounded-[7px] transition duration-300 px-4 py-2 block hover:(bg-white text-black dark:(bg-gray-900 !text-white))"
          >
            Submit
          </a>
        </div>
      </nav>
    </header>
  );
}
