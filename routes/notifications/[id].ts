// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { deleteNotification, getNotification } from "@/utils/db.ts";
import { redirect } from "@/utils/redirect.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const notification = await getNotification(ctx.params.id);
    if (notification === null) return await ctx.renderNotFound();

    await deleteNotification(notification);
    return redirect(notification.originUrl);
  },
};
