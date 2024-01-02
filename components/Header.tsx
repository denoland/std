// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { SITE_NAME } from "@/utils/constants.ts";
import { isStripeEnabled } from "@/utils/stripe.ts";
import IconX from "tabler_icons_tsx/x.tsx";
import IconMenu from "tabler_icons_tsx/menu-2.tsx";
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
  return (
    <header class="site-bar-styles flex-col sm:flex-row">
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
        class={"hidden flex-col gap-x-4 divide-y divide-solid sm:flex sm:items-center sm:flex-row sm:divide-y-0"}
      >
        <a
          href="/dashboard"
          class="link-styles data-[ancestor]:!text-black data-[ancestor]:dark:!text-white nav-item"
        >
          Dashboard
        </a>
        {isStripeEnabled() &&
          (
            <a
              href="/pricing"
              class="link-styles data-[current]:!text-black data-[current]:dark:!text-white nav-item"
            >
              Pricing
            </a>
          )}
        {props.sessionUser
          ? (
            <a
              href="/account"
              class="link-styles data-[current]:!text-black data-[current]:dark:!text-white nav-item"
            >
              Account
            </a>
          )
          : (
            <a href="/signin" class="link-styles nav-item">
              Sign in
            </a>
          )}
        <div class="rounded-lg bg-gradient-to-tr from-secondary to-primary p-px">
          <a
            href="/submit"
            class="text-center text-white rounded-[7px] transition duration-300 px-4 py-2 block hover:bg-white hover:text-black hover:dark:bg-gray-900 hover:dark:!text-white"
          >
            Submit
          </a>
        </div>
      </nav>
    </header>
  );
}
