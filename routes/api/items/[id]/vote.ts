// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Handlers, Status } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import {
  createNotification,
  createVote,
  deleteVote,
  getItem,
  getUserBySession,
  newNotificationProps,
  newVoteProps,
} from "@/utils/db.ts";
import { errors } from "std/http/http_errors.ts";

export const handler: Handlers<undefined, State> = {
  async POST(_req, ctx) {
    const itemId = ctx.params.id;
    const item = await getItem(itemId);
    if (item === null) throw new errors.NotFound("Item not found");

    if (ctx.state.sessionId === undefined) {
      throw new errors.Unauthorized("User must be signed in");
    }
    const user = await getUserBySession(ctx.state.sessionId);
    if (user === null) throw new errors.NotFound("User not found");

    await createVote({
      itemId,
      userLogin: user.login,
      ...newVoteProps(),
    });

    if (item.userLogin !== user.login) {
      await createNotification({
        userLogin: item.userLogin,
        type: "vote",
        text: `${user.login} upvoted your post: ${item.title}`,
        originUrl: `/items/${itemId}`,
        ...newNotificationProps(),
      });
    }

    return new Response(null, { status: Status.Created });
  },
  async DELETE(_req, ctx) {
    const itemId = ctx.params.id;
    const item = await getItem(itemId);
    if (item === null) throw new errors.NotFound("Item not found");

    if (ctx.state.sessionId === undefined) {
      throw new errors.Unauthorized("User must be signed in");
    }
    const user = await getUserBySession(ctx.state.sessionId);
    if (user === null) throw new errors.NotFound("User not found");

    await deleteVote({ itemId, userLogin: user.login });

    return new Response(null, { status: Status.NoContent });
  },
};
