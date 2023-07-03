// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getSessionId } from "kv_oauth";
import { redirect } from "@/utils/redirect.ts";
import { Status } from "std/http/http_status.ts";
import { getUserBySession, ifUserHasNotifications } from "@/utils/db.ts";
import { incrVisitsCountByDay } from "@/utils/db.ts";
import type { MetaProps } from "@/components/Meta.tsx";

export interface State extends MetaProps {
  sessionId?: string;
  hasNotifications?: boolean;
}

async function redirectToNewOrigin(
  req: Request,
  ctx: MiddlewareHandlerContext,
) {
  const { hostname } = new URL(req.url);
  return hostname === "saaskit.deno.dev"
    ? redirect("https://hunt.deno.land", Status.Found)
    : await ctx.next();
}

async function setState(req: Request, ctx: MiddlewareHandlerContext<State>) {
  if (ctx.destination !== "route") return await ctx.next();

  const sessionId = await getSessionId(req);
  ctx.state.sessionId = sessionId;

  if (sessionId) {
    const user = await getUserBySession(sessionId);
    ctx.state.hasNotifications = await ifUserHasNotifications(user!.id);
  }

  return await ctx.next();
}

async function recordVisit(
  _req: Request,
  ctx: MiddlewareHandlerContext,
) {
  if (ctx.destination !== "route") return await ctx.next();

  await incrVisitsCountByDay(new Date());
  return await ctx.next();
}

export const handler = [
  redirectToNewOrigin,
  setState,
  recordVisit,
];
