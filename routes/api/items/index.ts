import { Handlers } from "$fresh/server.ts";
import { collectValues, listItemsByTime } from "@/utils/db.ts";
import { getCursor } from "@/utils/pagination.ts";

// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const iter = listItemsByTime({
      cursor: getCursor(url),
      limit: 10,
      reverse: true,
    });
    const values = await collectValues(iter);
    return Response.json({ values, cursor: iter.cursor });
  },
};
