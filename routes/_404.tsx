import { HEADING_STYLES, LINK_STYLES } from "@/utils/constants.ts";

// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export default function NotFoundPage() {
  return (
    <main class="flex-1 p-4 flex flex-col justify-center text-center">
      <h1 class={HEADING_STYLES}>Page not found</h1>
      <p>
        <a href="/" class={LINK_STYLES}>Return home ›</a>
      </p>
    </main>
  );
}
