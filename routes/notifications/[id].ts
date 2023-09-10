// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import { getAndDeleteNotification } from "@/utils/db.ts";
import { redirect } from "@/utils/http.ts";
import type { SignedInState } from "@/middleware/session.ts";

export default async function NotificationPage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  try {
    const notification = await getAndDeleteNotification({
      id: ctx.params.id,
      userLogin: ctx.state.sessionUser.login,
    });
    return redirect(notification.originUrl);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return ctx.renderNotFound();
    throw error;
  }
}
