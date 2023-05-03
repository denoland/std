import type { Handlers } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import type { ItemPageData } from "@/routes/item/[id].tsx";
import { createOrDeleteVote } from "@/utils/db.ts";

export const handler: Handlers<ItemPageData, State> = {
  async POST(req, ctx) {
    if (!ctx.state.session) {
      return new Response(null, { status: 400 });
    }

    const params = new URL(req.url).searchParams;
    const itemId = params.get("to");
    const voteId = params.get("vote");

    if (itemId) {
      await createOrDeleteVote({
        userId: ctx.state.session.user.id,
        itemId,
        voteId,
      });
    }

    return Response.json({ ok: true });
  },
};
