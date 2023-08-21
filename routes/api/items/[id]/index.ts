// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Handlers, Status } from "$fresh/server.ts";
import { getItem } from "@/utils/db.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const item = await getItem(ctx.params.id);
    return item === null
      ? new Response(null, { status: Status.NotFound })
      : Response.json(item);
  },
};
