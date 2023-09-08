// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import type { State } from "@/middleware/session.ts";
import Head from "@/components/Head.tsx";
import ItemsList from "@/islands/ItemsList.tsx";

const NEEDS_SETUP = Deno.env.get("GITHUB_CLIENT_ID") === undefined ||
  Deno.env.get("GITHUB_CLIENT_SECRET") === undefined;

function SetupInstruction() {
  return (
    <div class="bg-green-50 dark:(bg-gray-900 border border-green-800) rounded-xl max-w-screen-sm mx-auto my-8 px-6 py-5 space-y-3">
      <h1 class="text-2xl font-medium">Welcome to SaaSKit!</h1>

      <p class="text-gray-600 dark:text-gray-400">
        To enable user login, you need to configure the GitHub OAuth application
        and set environment variables.
      </p>

      <p>
        <a
          href="https://github.com/denoland/saaskit#auth-oauth"
          class="inline-flex gap-2 text-green-600 dark:text-green-400 hover:underline cursor-pointer"
        >
          See the guide ›
        </a>
      </p>

      <p class="text-gray-600 dark:text-gray-400">
        After setting up{" "}
        <span class="bg-green-100 dark:bg-gray-800 p-1 rounded">
          GITHUB_CLIENT_ID
        </span>{" "}
        and{" "}
        <span class="bg-green-100 dark:bg-gray-800 p-1 rounded">
          GITHUB_CLIENT_SECRET
        </span>, this message will disappear.
      </p>
    </div>
  );
}

// deno-lint-ignore require-await
export default async function HomePage(
  _req: Request,
  ctx: RouteContext<undefined, State>,
) {
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
      </Head>
      <main class="flex-1 p-4">
        {NEEDS_SETUP && <SetupInstruction />}
        <ItemsList
          endpoint={endpoint}
          isSignedIn={isSignedIn}
        />
      </main>
    </>
  );
}
