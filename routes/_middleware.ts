// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { walk } from "std/fs/walk.ts";
import { getSessionId } from "kv_oauth";
import { redirect, setRedirectUrlCookie } from "@/utils/redirect.ts";
import { Status } from "std/http/http_status.ts";
import { getUserBySession, ifUserHasNotifications } from "@/utils/db.ts";
import { incrVisitsCountByDay } from "@/utils/db.ts";
import type { MetaProps } from "@/components/Meta.tsx";

export interface State extends MetaProps {
  sessionId?: string;
  hasNotifications?: boolean;
}

const STATIC_DIR_ROOT = new URL("../static", import.meta.url);
const staticFileNames: string[] = [];
for await (const { name } of walk(STATIC_DIR_ROOT, { includeDirs: false })) {
  staticFileNames.push(name);
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  const { pathname, hostname } = new URL(req.url);

  if (hostname === "saaskit.deno.dev") {
    return redirect("https://hunt.deno.land", Status.Found);
  }

  // Don't process session-related data for keepalive and static requests
  if (["_frsh", ...staticFileNames].some((part) => pathname.includes(part))) {
    return await ctx.next();
  }

  await incrVisitsCountByDay(new Date());

  const sessionId = await getSessionId(req);
  ctx.state.sessionId = sessionId;

  if (sessionId) {
    const user = await getUserBySession(sessionId);
    ctx.state.hasNotifications = await ifUserHasNotifications(user!.id);
  }

  const res = await ctx.next();

  if (ctx.destination === "route" && pathname === "/signin") {
    setRedirectUrlCookie(req, res);
  }

  return res;
}
