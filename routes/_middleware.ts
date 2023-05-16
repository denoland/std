// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { createSupabaseClient } from "@/utils/auth.ts";
import type { Session } from "@supabase/supabase-js";
import { walk } from "std/fs/walk.ts";

const STATIC_DIR_ROOT = new URL("../static", import.meta.url);
const staticFileNames: string[] = [];
for await (const { name } of walk(STATIC_DIR_ROOT, { includeDirs: false })) {
  staticFileNames.push(name);
}

export interface State {
  session: Session | null;
  supabaseClient: ReturnType<typeof createSupabaseClient>;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  const { pathname } = new URL(req.url);
  // Don't process session-related data for keepalive and static requests
  if (["_frsh", ...staticFileNames].some((part) => pathname.includes(part))) {
    return await ctx.next();
  }

  const headers = new Headers();
  const supabaseClient = createSupabaseClient(req.headers, headers);

  const { data: { session } } = await supabaseClient.auth.getSession();

  ctx.state.session = session;
  ctx.state.supabaseClient = supabaseClient;

  const response = await ctx.next();
  /**
   * Note: ensure that a `new Response()` with a `location` header is used when performing server-side redirects.
   * Using `Response.redirect()` will throw as its headers are immutable.
   */
  headers.forEach((value, key) => response.headers.append(key, value));
  return response;
}
