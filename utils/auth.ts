// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { MiddlewareHandlerContext } from "$fresh/server.ts";

import { createServerSupabaseClient } from "@supabase/auth-helpers-shared";
import { getCookies, setCookie } from "std/http/cookie.ts";

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;

export function createSupabaseClient(
  requestHeaders: Headers,
  responseHeaders?: Headers,
) {
  return createServerSupabaseClient({
    supabaseUrl: Deno.env.get("SUPABASE_API_URL")!,
    supabaseKey: Deno.env.get("SUPABASE_ANON_KEY")!,
    getRequestHeader: (key) => requestHeaders.get(key) ?? undefined,
    getCookie: (name) => {
      const cookie = getCookies(requestHeaders)[name] ?? "";
      return decodeURIComponent(cookie);
    },
    setCookie: (name, value, options) => {
      if (responseHeaders) {
        setCookie(responseHeaders, {
          name,
          value: encodeURIComponent(value),
          ...options,
          sameSite: "Lax",
          httpOnly: false,
        });
      }
    },
  });
}

export async function ensureLoggedInMiddleware(
  req: Request,
  ctx: MiddlewareHandlerContext,
) {
  if (!ctx.state.session) {
    return new Response(null, {
      headers: {
        location: `/login?redirect_url=${encodeURIComponent(req.url)}`,
      },
      /** @todo Confirm whether this HTTP redirect status code is correct */
      status: 302,
    });
  }

  return await ctx.next();
}
