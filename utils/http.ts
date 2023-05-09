// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RedirectStatus, Status } from "std/http/http_status.ts";

/**
 * This function is used rather than `Response.redirect()`.
 * `Response.redirect()` will throw if `Response.headers` is modified.
 * `Response.headers` is modified when setting session cookies for Supabase Auth.
 *
 * @param location A relative (to the request URL) or absolute URL.
 * @param status HTTP status
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location}
 */
export function redirect(
  location: string,
  status: Status.Created | RedirectStatus = 303,
) {
  return new Response(null, {
    headers: {
      location,
    },
    status,
  });
}
