// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Handlers, Status } from "$fresh/server.ts";
import { collectValues, getUser, listNotificationsByUser } from "@/utils/db.ts";
import { getCursor } from "@/utils/pagination.ts";

/** @todo(iuioiua) Move to GET /api/me/notifications */
export const handler: Handlers = {
  async GET(req, ctx) {
    const user = await getUser(ctx.params.login);
    if (user === null) return new Response(null, { status: Status.NotFound });

    const url = new URL(req.url);
    const iter = listNotificationsByUser(user.login, {
      cursor: getCursor(url),
      limit: 10,
      // Newest to oldest
      reverse: true,
    });
    const values = await collectValues(iter);
    return Response.json({ values, cursor: iter.cursor });
  },
};
