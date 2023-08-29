import { Handlers, Status } from "$fresh/server.ts";
import { collectValues, getItem, listCommentsByItem } from "@/utils/db.ts";
import { getCursor } from "@/utils/pagination.ts";

// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export const handler: Handlers = {
  async GET(req, ctx) {
    const itemId = ctx.params.id;
    const item = await getItem(itemId);
    if (item === null) return new Response(null, { status: Status.NotFound });

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
