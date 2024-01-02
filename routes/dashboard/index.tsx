// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { redirect } from "@/utils/http.ts";
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET() {
    return redirect("/dashboard/stats");
  },
};
