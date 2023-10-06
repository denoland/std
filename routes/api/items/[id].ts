// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { getItem } from "@/utils/db.ts";
import { Status } from "std/http/http_status.ts";
import { createHttpError } from "std/http/http_errors.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const item = await getItem(ctx.params.id);
    if (item === null) throw createHttpError(Status.NotFound, "Item not found");
    return Response.json(item);
  },
};
