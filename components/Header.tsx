// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  BUTTON_STYLES,
  LINK_STYLES,
  NAV_STYLES,
  SITE_BAR_STYLES,
} from "@/utils/constants.ts";
import Logo from "./Logo.tsx";
import { stripe } from "@/utils/payments.ts";
import { Bell, CircleFilled } from "./Icons.tsx";

export default function Header(
  props: { sessionId?: string; hasNotifications: boolean },
) {
  return (
    <header class={SITE_BAR_STYLES}>
      <a href="/">
        <Logo height="48" />
      </a>
      <nav class={NAV_STYLES}>
        {stripe ? <a href="/pricing" class={LINK_STYLES}>Pricing</a> : null}
        {props.sessionId
          ? <a href="/account" class={LINK_STYLES}>Account</a>
          : <a href="/signin" class={LINK_STYLES}>Sign in</a>}
        <a
          href="/account/notifications"
          class={LINK_STYLES + " relative"}
          aria-label="Notifications"
        >
          <Bell class="w-6 h-6" />
          {props.hasNotifications && (
            <CircleFilled class="absolute top-0.5 right-0.5 text-pink-700 w-2 h-2" />
          )}
        </a>
        <a href="/submit" class={BUTTON_STYLES}>Submit</a>
      </nav>
    </header>
  );
}
