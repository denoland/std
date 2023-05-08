// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import { createVote, deleteVote } from "@/utils/db.ts";

export const handler: Handlers<PageProps, State> = {
  async POST(req, ctx) {
    if (!ctx.state.session) {
      return new Response(null, { status: 400 });
    }

    const params = new URL(req.url).searchParams;
    const itemId = params.get("item_id");

    if (!itemId) {
      return new Response(null, { status: 400 });
    }

    const userId = ctx.state.session.user.id;

    await createVote({
      userId,
      itemId,
    });

    return new Response(null, { status: 201 });
  },

  async DELETE(req, ctx) {
    if (!ctx.state.session) {
      return new Response(null, { status: 400 });
    }
    const params = new URL(req.url).searchParams;
    const itemId = params.get("item_id");

    if (!itemId) {
      return new Response(null, { status: 400 });
    }

    const userId = ctx.state.session.user.id;

    await deleteVote({
      userId,
      itemId,
    });

    return new Response(null, { status: 204 });
  },
};
