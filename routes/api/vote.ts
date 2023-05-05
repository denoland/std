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
    const itemId = params.get("to");

    if (itemId) {
      await createVote({
        userId: ctx.state.session.user.id,
        itemId,
      });
    }

    return Response.json({ ok: true });
  },

  async DELETE(req, ctx) {
    if (!ctx.state.session) {
      return new Response(null, { status: 400 });
    }
    const params = new URL(req.url).searchParams;
    const itemId = params.get("to");
    const voteId = params.get("vote");

    if (itemId && voteId) {
      await deleteVote({
        userId: ctx.state.session.user.id,
        itemId,
        voteId,
      });
    }

    return Response.json({ ok: true });
  },
};
