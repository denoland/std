// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Handlers, Status } from "$fresh/server.ts";
import type { SignedInState } from "@/plugins/session.ts";
import { createVote } from "@/utils/db.ts";
import { BadRequestError } from "@/utils/http.ts";

export const handler: Handlers<undefined, SignedInState> = {
  async POST(req, ctx) {
    const itemId = new URL(req.url).searchParams.get("item_id");
    if (itemId === null) {
      throw new BadRequestError("`item_id` URL parameter missing");
    }

    await createVote({
      itemId,
      userLogin: ctx.state.sessionUser.login,
    });

    return new Response(null, { status: Status.Created });
  },
};
