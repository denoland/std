// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { LINK_STYLES } from "@/utils/constants.ts";
import { cx } from "@twind/core";

export default function TabsBar(
  props: { links: { path: string; innerText: string }[]; currentPath: string },
) {
  return (
    <div class="flex flex-row w-full mb-8">
      {props.links.map((link) => (
        <a
          href={link.path}
          class={cx(
            "px-4 py-2 rounded-lg",
            link.path === props.currentPath
              ? "bg-gray-100 text-black dark:(bg-gray-800 text-white)"
              : "",
            LINK_STYLES,
          )}
        >
          {link.innerText}
        </a>
      ))}
    </div>
  );
}
