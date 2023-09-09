// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getSessionId } from "kv_oauth";
import {
  getUserBySession,
  ifUserHasNotifications,
  type User,
} from "@/utils/db.ts";
import { createHttpError } from "std/http/http_errors.ts";
import { Status } from "std/http/http_status.ts";

export interface State {
  sessionUser?: User;
  hasNotifications: boolean;
}

export type SignedInState = Required<State>;

export async function setSessionState(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  if (ctx.destination !== "route") return await ctx.next();

  // Initial state
  ctx.state.sessionUser = undefined;
  ctx.state.hasNotifications = false;

  const sessionId = getSessionId(req);
  if (sessionId === undefined) return await ctx.next();
  const user = await getUserBySession(sessionId);
  if (user === null) return await ctx.next();

  ctx.state.sessionUser = user;
  ctx.state.hasNotifications = await ifUserHasNotifications(user.login);

  return await ctx.next();
}

export function assertSignedIn(
  ctx: { state: State },
): asserts ctx is { state: SignedInState } {
  if (ctx.state.sessionUser === undefined) {
    throw createHttpError(Status.Unauthorized, "User must be signed in");
  }
}

export async function ensureSignedIn(
  _req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  assertSignedIn(ctx);
  return await ctx.next();
}
