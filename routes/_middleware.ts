// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { MiddlewareHandlerContext } from "$fresh/server.ts";
import { redirect } from "@/utils/http.ts";
import { Status } from "std/http/http_status.ts";
import { incrVisitsCountByDay } from "@/utils/db.ts";
import { setSessionState } from "@/middleware/session.ts";

async function redirectToNewOrigin(
  req: Request,
  ctx: MiddlewareHandlerContext,
) {
  const { hostname } = new URL(req.url);
  return hostname === "saaskit.deno.dev"
    ? redirect("https://hunt.deno.land", Status.Found)
    : await ctx.next();
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
  setSessionState,
  recordVisit,
];
