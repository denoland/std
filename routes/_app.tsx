// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import Header from "@/components/Header.tsx";
import Footer from "@/components/Footer.tsx";
import type { State } from "@/plugins/session.ts";
import { defineApp } from "$fresh/server.ts";

export default defineApp<State>((_, ctx) => {
  return (
    <div class="dark:bg-gray-900">
      <div class="flex flex-col min-h-screen mx-auto max-w-7xl w-full dark:text-white">
        <Header
          url={ctx.url}
          sessionUser={ctx.state?.sessionUser}
        />
        <ctx.Component />
        <Footer url={ctx.url} />
      </div>
    </div>
  );
});
