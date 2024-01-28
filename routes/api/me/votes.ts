// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { collectValues, listItemsVotedByUser } from "@/utils/db.ts";
import { SignedInState } from "@/plugins/session.ts";

export const handler: Handlers<undefined, SignedInState> = {
  async GET(_req, ctx) {
    const iter = listItemsVotedByUser(ctx.state.sessionUser.login);
    const items = await collectValues(iter);
    return Response.json(items);
  },
};
