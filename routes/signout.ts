// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { signOut } from "deno_kv_oauth";

export const handler: Handlers = {
  async GET(req) {
    return await signOut(req);
  },
};
