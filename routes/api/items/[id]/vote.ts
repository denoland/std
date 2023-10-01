// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Handlers, Status } from "$fresh/server.ts";
import type { SignedInState } from "@/plugins/session.ts";
import { createVote, getItem } from "@/utils/db.ts";
import { createHttpError } from "std/http/http_errors.ts";

export const handler: Handlers<undefined, SignedInState> = {
  async POST(_req, ctx) {
    const itemId = ctx.params.id;
    const item = await getItem(itemId);
    if (item === null) throw createHttpError(Status.NotFound, "Item not found");

    const { sessionUser } = ctx.state;
    await createVote({
      itemId,
      userLogin: sessionUser.login,
    });

    return new Response(null, { status: Status.Created });
  },
};
