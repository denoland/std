// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { ErrorPageProps } from "$fresh/server.ts";
import { HEADING_STYLES, LINK_STYLES } from "@/utils/constants.ts";

export default function Error500Page(props: ErrorPageProps) {
  return (
    <main class="flex flex-1 flex-col justify-center p-4 text-center space-y-4">
      <h1 class={HEADING_STYLES}>Server error</h1>
      <p>500 internal error: {(props.error as Error).message}</p>
      <p>
        <a href="/" class={LINK_STYLES}>Return home ›</a>
      </p>
    </main>
  );
}
