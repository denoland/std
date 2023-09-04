// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { collectValues, listNotifications } from "@/utils/db.ts";
import { getCursor } from "@/utils/http.ts";
import { SignedInState } from "@/middleware/session.ts";

export const handler: Handlers<undefined, SignedInState> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const iter = listNotifications(ctx.state.sessionUser.login, {
      cursor: getCursor(url),
      limit: 10,
      // Newest to oldest
      reverse: true,
    });
    const values = await collectValues(iter);
    return Response.json({ values, cursor: iter.cursor });
  },
};
