// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import type { State } from "@/plugins/session.ts";
import Head from "@/components/Head.tsx";
import ItemsList from "@/islands/ItemsList.tsx";
import { defineRoute } from "$fresh/server.ts";

export default defineRoute<State>((_req, ctx) => {
  const isSignedIn = ctx.state.sessionUser !== undefined;
  const endpoint = "/api/items";

  return (
    <>
      <Head href={ctx.url.href}>
        <link
          as="fetch"
          crossOrigin="anonymous"
          href={endpoint}
          rel="preload"
        />
        {isSignedIn && (
          <link
            as="fetch"
            crossOrigin="anonymous"
            href="/api/me/votes"
            rel="preload"
          />
        )}
      </Head>
      <main class="flex-1 p-4">
        <ItemsList
          endpoint={endpoint}
          isSignedIn={isSignedIn}
        />
      </main>
    </>
  );
});
