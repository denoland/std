// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Handlers, Status } from "$fresh/server.ts";
import { getUser } from "@/utils/db.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const user = await getUser(ctx.params.login);
    return user === null
      ? new Response(null, { status: Status.NotFound })
      : Response.json(user);
  },
};
