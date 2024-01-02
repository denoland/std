// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.

import { collectValues, listItems } from "@/utils/db.ts";
import { getCursor } from "@/utils/http.ts";
import type { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const iter = listItems({
      cursor: getCursor(url),
      limit: 10,
      reverse: true,
    });
    const values = await collectValues(iter);
    return Response.json({ values, cursor: iter.cursor });
  },
};
