// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Handlers, Status } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import {
  collectValues,
  getUserBySession,
  listItemsVotedByUser,
} from "@/utils/db.ts";

export const handler: Handlers<undefined, State> = {
  async GET(_req, ctx) {
    if (ctx.state.sessionId === undefined) {
      return new Response(null, { status: Status.Unauthorized });
    }

    const user = await getUserBySession(ctx.state.sessionId);
    if (user === null) return new Response(null, { status: Status.NotFound });

    const iter = listItemsVotedByUser(user.login);
    const items = await collectValues(iter);
    return Response.json(items);
  },
};
