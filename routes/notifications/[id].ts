// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import { deleteNotification, getNotification } from "@/utils/db.ts";
import { redirect } from "@/utils/http.ts";
import { SignedInState } from "@/middleware/session.ts";

export default async function NotificationsNotificationPage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  const notification = await getNotification(ctx.params.id);
  if (notification === null) return await ctx.renderNotFound();

  await deleteNotification(notification);
  return redirect(notification.originUrl);
}
