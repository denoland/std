// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { createHttpError } from "std/http/http_errors.ts";
import { getCursor } from "@/utils/http.ts";
import { collectValues, getItem, listCommentsByItem } from "@/utils/db.ts";
import type { State } from "@/middleware/session.ts";
import { Status } from "std/http/http_status.ts";

export const handler: Handlers<undefined, State> = {
  async GET(req, ctx) {
    const itemId = ctx.params.id;
    const item = await getItem(itemId);
    if (item === null) throw createHttpError(Status.NotFound, "Item not found");

    const url = new URL(req.url);
    const iter = listCommentsByItem(itemId, {
      cursor: getCursor(url),
      limit: 10,
      // Newest to oldest
      reverse: true,
    });
    const values = await collectValues(iter);
    return Response.json({ values, cursor: iter.cursor });
  },
};
