// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { collectValues, getUser, listItemsByUser } from "@/utils/db.ts";
import { getCursor } from "@/utils/http.ts";
import { errors } from "std/http/http_errors.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const user = await getUser(ctx.params.login);
    if (user === null) throw new errors.NotFound("User not found");

    const url = new URL(req.url);
    const iter = listItemsByUser(ctx.params.login, {
      cursor: getCursor(url),
      limit: 10,
    });
    const values = await collectValues(iter);
    return Response.json({ values, cursor: iter.cursor });
  },
};
