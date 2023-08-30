// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Handlers, Status } from "$fresh/server.ts";
import {
  collectValues,
  getUserBySession,
  listNotificationsByUser,
} from "@/utils/db.ts";
import { getCursor } from "@/utils/pagination.ts";
import { State } from "@/routes/_middleware.ts";

export const handler: Handlers<undefined, State> = {
  async GET(req, ctx) {
    if (ctx.state.sessionId === undefined) {
      return new Response(null, { status: Status.Unauthorized });
    }

    const user = await getUserBySession(ctx.state.sessionId);
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
