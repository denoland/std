// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type MiddlewareHandlerContext, Status } from "$fresh/server.ts";
import { getSessionId } from "kv_oauth";
import {
  getUserBySession,
  ifUserHasNotifications,
  type User,
} from "@/utils/db.ts";
import { errors } from "std/http/http_errors.ts";
import { redirect } from "@/utils/http.ts";
import { isHttpError } from "std/http/http_errors.ts";

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
    throw new errors.Unauthorized("User must be signed in");
  }
}

export async function ensureSignedIn(
  _req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  assertSignedIn(ctx);
  return await ctx.next();
}

// For web pages
export async function handleNotSignedInWebpage(
  _req: Request,
  ctx: MiddlewareHandlerContext,
) {
  try {
    return await ctx.next();
  } catch (error) {
    if (error instanceof errors.Unauthorized) return redirect("/signin");
    throw error;
  }
}

/**
 * This middleware is for REST API endpoints. The returned response is based on the error thrown downstream.
 */
export async function handleNotSignedInRest(
  _req: Request,
  ctx: MiddlewareHandlerContext,
) {
  try {
    return await ctx.next();
  } catch (error) {
    return isHttpError(error)
      ? new Response(error.message, {
        status: error.status,
        headers: error.headers,
      })
      : new Response(error.message, { status: Status.InternalServerError });
  }
}
