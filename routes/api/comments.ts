// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { createHttpError } from "std/http/http_errors.ts";
import { createComment, createNotification, getItem } from "@/utils/db.ts";
import { redirect } from "@/utils/http.ts";
import { assertSignedIn, State } from "@/middleware/session.ts";
import { ulid } from "std/ulid/mod.ts";
import { Status } from "std/http/http_status.ts";

export const handler: Handlers<undefined, State> = {
  async POST(req, ctx) {
    assertSignedIn(ctx);

    const form = await req.formData();
    const text = form.get("text");
    const itemId = form.get("item_id");
    if (typeof text !== "string") {
      throw createHttpError(Status.BadRequest, "Text must be a string");
    }
    if (typeof itemId !== "string") {
      throw createHttpError(Status.BadRequest, "Item ID must be a string");
    }

    const item = await getItem(itemId);
    if (item === null) throw createHttpError(Status.NotFound, "Item not found");

    const { sessionUser } = ctx.state;
    await createComment({
      id: ulid(),
      userLogin: sessionUser.login,
      itemId: itemId,
      text,
    });

    if (item.userLogin !== sessionUser.login) {
      await createNotification({
        id: ulid(),
        userLogin: item.userLogin,
        type: "comment",
        text: `${sessionUser.login} commented on your post: ${item.title}`,
        originUrl: `/items/${itemId}`,
      });
    }

    return redirect("/items/" + itemId);
  },
};
