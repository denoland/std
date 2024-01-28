// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { PageProps } from "$fresh/server.ts";

export default function Error500Page(props: PageProps) {
  return (
    <main class="flex flex-1 flex-col justify-center p-4 text-center space-y-4">
      <h1 class="heading-styles">Server error</h1>
      <p>500 internal error: {(props.error as Error).message}</p>
      <p>
        <a href="/" class="link-styles">Return home &#8250;</a>
      </p>
    </main>
  );
}
