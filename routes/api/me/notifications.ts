// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import {
  collectValues,
  getUserBySession,
  listNotificationsByUser,
} from "@/utils/db.ts";
import { getCursor } from "@/utils/http.ts";
import { State } from "@/routes/_middleware.ts";
import { errors } from "std/http/http_errors.ts";

export const handler: Handlers<undefined, State> = {
  async GET(req, ctx) {
    if (ctx.state.sessionId === undefined) {
      throw new errors.Unauthorized("User must be signed in");
    }

    const user = await getUserBySession(ctx.state.sessionId);
    if (user === null) throw new errors.NotFound("User not found");

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
