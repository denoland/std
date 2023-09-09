// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Handlers, Status } from "$fresh/server.ts";
import { assertSignedIn, type State } from "@/middleware/session.ts";
import {
  createNotification,
  createVote,
  deleteVote,
  getItem,
} from "@/utils/db.ts";
import { ulid } from "std/ulid/mod.ts";
import { createHttpError } from "std/http/http_errors.ts";

export const handler: Handlers<undefined, State> = {
  async POST(_req, ctx) {
    assertSignedIn(ctx);

    const itemId = ctx.params.id;
    const item = await getItem(itemId);
    if (item === null) throw createHttpError(Status.NotFound, "Item not found");

    const { sessionUser } = ctx.state;
    await createVote({
      itemId,
      userLogin: sessionUser.login,
      createdAt: new Date(),
    });

    if (item.userLogin !== sessionUser.login) {
      await createNotification({
        id: ulid(),
        userLogin: item.userLogin,
        type: "vote",
        text: `${sessionUser.login} upvoted your post: ${item.title}`,
        originUrl: `/items/${itemId}`,
      });
    }

    return new Response(null, { status: Status.Created });
  },
  async DELETE(_req, ctx) {
    assertSignedIn(ctx);

    const itemId = ctx.params.id;
    const item = await getItem(itemId);
    if (item === null) throw createHttpError(Status.NotFound, "Item not found");

    await deleteVote({ itemId, userLogin: ctx.state.sessionUser.login });

    return new Response(null, { status: Status.NoContent });
  },
};
