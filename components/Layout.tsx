// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { ComponentChild, ComponentChildren, JSX } from "preact";
import {
  BUTTON_STYLES,
  SITE_NAME,
  SITE_WIDTH_STYLES,
} from "@/utils/constants.ts";
import Logo from "./Logo.tsx";
import { stripe } from "@/utils/payments.ts";
import { Bell, CircleFilled, Discord, GitHub } from "./Icons.tsx";

interface NavProps extends JSX.HTMLAttributes<HTMLElement> {
  active?: string;
  items: (JSX.HTMLAttributes<HTMLAnchorElement> & { inner: ComponentChild })[];
}

function Nav(props: NavProps) {
  return (
    <nav>
      <ul
        class={`flex gap-x-8 gap-y-2 items-center justify-between h-full ${
          props.class ?? ""
        }`}
      >
        {props.items.map((item) => (
          <li>
            <a
              href={item.href}
              class="text-gray-500 hover:text-black dark:(hover:text-white) transition duration-300"
            >
              {item.inner}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Header(props: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <header
      {...props}
      class={`p-4 justify-between ${SITE_WIDTH_STYLES} flex z-10 ${
        props.class ?? ""
      }`}
    >
      <a href="/">
        <Logo height="48" />
      </a>
      {props.children}
    </header>
  );
}

function Footer(props: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <footer
      {...props}
      class={`flex flex-col md:flex-row mt-8 p-4 justify-between gap-y-4 ${SITE_WIDTH_STYLES} ${
        props.class ?? ""
      } `}
    >
      <p>© {SITE_NAME}</p>
      {props.children}
    </footer>
  );
}

interface LayoutProps {
  children: ComponentChildren;
  session?: string;
  hasNotifications?: boolean;
}

interface NavItem {
  href: string;
  inner: string | JSX.Element;
}

const notificationsStyle =
  "px-2 py-1 bg-red-600 text-white text-xs rounded-full border-1 border-red-600 transition duration-300 disabled:(opacity-50 cursor-not-allowed) hover:(bg-transparent text-red-600)";

export default function Layout(props: LayoutProps) {
  const headerNavItems: NavItem[] = [
    props.session
      ? {
        href: "/account",
        inner: "Account",
      }
      : {
        href: "/signin",
        inner: "Sign in",
      },
  ];

  headerNavItems.push({
    href: "/account/notifications",
    inner: (
      <div class="relative">
        <Bell class="w-6 h-6" />
        {props.hasNotifications!
          ? (
            <CircleFilled class="absolute top-0.5 right-0.5 text-pink-700 w-2 h-2" />
          )
          : ""}
      </div>
    ),
  });

  headerNavItems.push({
    href: "/submit",
    inner: <span class={BUTTON_STYLES}>Submit</span>,
  });

  if (stripe !== undefined) {
    headerNavItems.unshift({
      href: "/pricing",
      inner: "Pricing",
    });
  }

  const footerNavItems: NavItem[] = [
    {
      href: "/stats",
      inner: "Stats",
    },
    {
      href: "/blog",
      inner: "Blog",
    },
    {
      inner: <Discord />,
      href: "https://discord.gg/deno",
    },
    {
      inner: <GitHub />,
      href: "https://github.com/denoland/saaskit",
    },
    {
      href: "https://fresh.deno.dev",
      inner: (
        <img
          width="197"
          height="37"
          src="https://fresh.deno.dev/fresh-badge.svg"
          alt="Made with Fresh"
        />
      ),
    },
  ];

  return (
    <div class="flex flex-col min-h-screen dark:bg-gray-900 dark:text-white">
      <Header>
        <Nav items={headerNavItems} />
      </Header>
      {props.children}
      <Footer>
        <Nav items={footerNavItems} />
      </Footer>
    </div>
  );
}
