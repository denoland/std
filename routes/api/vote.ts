// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import { createVote, deleteVote } from "@/utils/db.ts";

export const handler: Handlers<PageProps, State> = {
  async POST(req, ctx) {
    return await (responseFn(req, ctx));
  },

  async DELETE(req, ctx) {
    return await (responseFn(req, ctx));
  },
};

const responseFn = async (
  req: Request,
  // deno-lint-ignore no-explicit-any
  ctx: HandlerContext<PageProps<any>, State>,
) => {
  if (!ctx.state.session) {
    return new Response(null, { status: 400 });
  }

  const itemId = new URL(req.url).searchParams.get("item_id");

  if (!itemId) {
    return new Response(null, { status: 400 });
  }

  const userId = ctx.state.session.user.id;
  const data = {
    userId,
    itemId,
  };
  let status;
  switch (req.method) {
    case "DELETE":
      status = 204;
      await deleteVote(data);
      break;
    case "POST":
      status = 201;
      await createVote(data);
      break;
    default:
      return new Response(null, { status: 400 });
  }

  return new Response(null, { status });
};
