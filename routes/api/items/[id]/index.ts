// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { getItem } from "@/utils/db.ts";
import { errors } from "std/http/http_errors.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const item = await getItem(ctx.params.id);
    if (item === null) throw new errors.NotFound("Item not found");
    return Response.json(item);
  },
};
