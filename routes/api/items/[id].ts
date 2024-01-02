// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { getItem } from "@/utils/db.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const item = await getItem(ctx.params.id);
    if (item === null) throw new Deno.errors.NotFound("Item not found");
    return Response.json(item);
  },
};
