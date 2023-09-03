// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import {
  collectValues,
  getUserBySession,
  listItemsVotedByUser,
} from "@/utils/db.ts";
import { errors } from "std/http/http_errors.ts";

export const handler: Handlers<undefined, State> = {
  async GET(_req, ctx) {
    if (ctx.state.sessionId === undefined) {
      throw new errors.Unauthorized("User must be signed in");
    }

    const user = await getUserBySession(ctx.state.sessionId);
    if (user === null) throw new errors.NotFound("User not found");

    const iter = listItemsVotedByUser(user.login);
    const items = await collectValues(iter);
    return Response.json(items);
  },
};
