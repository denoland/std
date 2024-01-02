// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import type { Plugin } from "$fresh/server.ts";
import { isGitHubSetup } from "@/utils/github.ts";
import { redirect } from "@/utils/http.ts";

export default {
  name: "welcome",
  middlewares: [{
    path: "/",
    middleware: {
      handler: async (req, ctx) => {
        const { pathname } = new URL(req.url);
        return !isGitHubSetup() && pathname !== "/welcome" &&
            ctx.destination === "route"
          ? redirect("/welcome")
          : await ctx.next();
      },
    },
  }],
} as Plugin;
