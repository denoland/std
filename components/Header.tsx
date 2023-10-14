// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  ACTIVE_ANCESTOR_LINK_STYLES,
  ACTIVE_LINK_STYLES,
  LINK_STYLES,
  SITE_BAR_STYLES,
  SITE_NAME,
} from "@/utils/constants.ts";
import { isStripeEnabled } from "@/utils/stripe.ts";
import IconX from "tabler_icons_tsx/x.tsx";
import IconMenu from "tabler_icons_tsx/menu-2.tsx";
import { cx } from "@twind/core";
import { User } from "@/utils/db.ts";

export interface HeaderProps {
  /** Currently signed-in user */
  sessionUser?: User;
  /**
   * URL of the current page. This is used for highlighting the currently
   * active page in navigation.
   */
  url: URL;
}

export default function Header(props: HeaderProps) {
  const NAV_ITEM = "text-gray-500 px-3 py-4 sm:py-2";
  return (
    <header
      class={cx(
        SITE_BAR_STYLES,
        "flex-col sm:flex-row",
      )}
    >
      <input
        type="checkbox"
        id="nav-toggle"
        class="hidden [:checked&+*>:last-child>*>:first-child]:hidden [:checked&+*>:last-child>*>:last-child]:block checked:siblings:last-child:flex"
      />

      <div class="flex justify-between items-center">
        <a href="/" class="shrink-0">
          <img
            height="48"
            width="48"
            src="/logo.webp"
            alt={SITE_NAME + " logo"}
            class="h-12 w-12"
          />
        </a>
        <div class="flex gap-4 items-center">
          <label
            tabIndex={0}
            class="sm:hidden"
            id="nav-toggle-label"
            htmlFor="nav-toggle"
          >
            <IconMenu class="w-6 h-6" />
            <IconX class="hidden w-6 h-6" />
          </label>
        </div>
      </div>
      <script>
        {`
          const navToggleLabel = document.getElementById('nav-toggle-label');
          navToggleLabel.addEventListener('keydown', () => {
            if (event.code === 'Space' || event.code === 'Enter') {
              navToggleLabel.click();
              event.preventDefault();
            }
          });
        `}
      </script>
      <nav
        class={"hidden flex-col gap-x-4 divide-y divide-solid sm:(flex items-center flex-row divide-y-0)"}
      >
        <a
          href="/dashboard"
          class={cx(LINK_STYLES, ACTIVE_ANCESTOR_LINK_STYLES, NAV_ITEM)}
        >
          Dashboard
        </a>
        {isStripeEnabled() &&
          (
            <a
              href="/pricing"
              class={cx(LINK_STYLES, ACTIVE_LINK_STYLES, NAV_ITEM)}
            >
              Pricing
            </a>
          )}
        {props.sessionUser
          ? (
            <a
              href="/account"
              class={cx(LINK_STYLES, ACTIVE_LINK_STYLES, NAV_ITEM)}
            >
              Account
            </a>
          )
          : <a href="/signin" class={cx(LINK_STYLES, NAV_ITEM)}>Sign in</a>}
        <div class="rounded-lg bg-gradient-to-tr from-secondary to-primary p-px">
          <a
            href="/submit"
            class="text-center text-white rounded-[7px] transition duration-300 px-4 py-2 block hover:(bg-white text-black dark:(bg-gray-900 !text-white))"
          >
            Submit
          </a>
        </div>
      </nav>
    </header>
  );
}
