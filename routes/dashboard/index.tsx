// Copyright 2023 the Deno authors. All rights reserved. MIT license.

import type { Handlers } from "$fresh/server.ts";
import { redirect } from "@/utils/redirect.ts";

export const handler: Handlers = {
  GET(_req) {
    return redirect("/dashboard/stats");
  },
};
