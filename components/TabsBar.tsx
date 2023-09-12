// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { LINK_STYLES } from "@/utils/constants.ts";
import { cx } from "@twind/core";
import { ComponentChildren } from "preact";

export interface TabItemProps {
  /** Path of the item's URL */
  path: string;
  /** Whether the user is on the item's URL */
  active: boolean;
  children?: ComponentChildren;
}

export function TabItem(props: TabItemProps) {
  return (
    <a
      href={props.path}
      class={cx(
        "px-4 py-2 rounded-lg",
        props.active
          ? "bg-gray-100 text-black dark:(bg-gray-800 text-white)"
          : "",
        LINK_STYLES,
      )}
    >
      {props.children}
    </a>
  );
}

export interface TabsBarProps {
  links: {
    path: string;
    innerText: string;
  }[];
  currentPath: string;
}

export default function TabsBar(props: TabsBarProps) {
  return (
    <div class="flex flex-row w-full mb-8">
      {props.links.map((link) => (
        <TabItem path={link.path} active={link.path === props.currentPath}>
          {link.innerText}
        </TabItem>
      ))}
    </div>
  );
}
