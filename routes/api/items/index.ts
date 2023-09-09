import { collectValues, listItems } from "@/utils/db.ts";
import { getCursor } from "@/utils/http.ts";
import { type Handlers } from "$fresh/server.ts";
import { createItem, type Item } from "@/utils/db.ts";
import { redirect } from "@/utils/http.ts";
import { assertSignedIn, State } from "@/middleware/session.ts";
import { createHttpError } from "std/http/http_errors.ts";
import { ulid } from "std/ulid/mod.ts";
import { Status } from "std/http/http_status.ts";

// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export const handler: Handlers<undefined, State> = {
  async GET(req) {
    const url = new URL(req.url);
    const iter = listItems({
      cursor: getCursor(url),
      limit: 10,
      reverse: true,
    });
    const values = await collectValues(iter);
    return Response.json({ values, cursor: iter.cursor });
  },
  async POST(req, ctx) {
    assertSignedIn(ctx);

    const form = await req.formData();
    const title = form.get("title");
    const url = form.get("url");

    if (typeof title !== "string") {
      throw createHttpError(Status.BadRequest, "Title is missing");
    }
    if (typeof url !== "string" || !URL.canParse(url)) {
      throw createHttpError(Status.BadRequest, "URL is invalid or missing");
    }

    const item: Item = {
      id: ulid(),
      userLogin: ctx.state.sessionUser.login,
      title,
      url,
      score: 0,
    };
    await createItem(item);
    return redirect("/items/" + item.id);
  },
};
