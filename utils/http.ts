// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { RedirectStatus, Status } from "std/http/http_status.ts";

/**
 * Returns a response that redirects the client to the given location (URL).
 *
 * @param location A relative (to the request URL) or absolute URL.
 * @param status HTTP status
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location}
 *
 * @example
 * ```ts
 * import { redirect } from "@/utils/http.ts";
 *
 * redirect("/new-page"); // Redirects client to `/new-page` with HTTP status 303
 * redirect("/new-page", 301); // Redirects client to `/new-page` with HTTP status 301
 * ```
 */
export function redirect(
  location: string,
  status: Status.Created | RedirectStatus = Status.SeeOther,
) {
  return new Response(null, {
    headers: {
      location,
    },
    status,
  });
}

/**
 * Returns the `cursor` URL parameter value of the given URL.
 *
 * @example
 * ```ts
 * import { getCursor } from "@/utils/http.ts";
 *
 * getCursor(new URL("http://example.com?cursor=12345")); // Returns "12345"
 * getCursor(new URL("http://example.com")); // Returns ""
 * ```
 */
export function getCursor(url: URL) {
  return url.searchParams.get("cursor") ?? "";
}

export async function fetchValues<T>(endpoint: string, cursor: string) {
  let url = endpoint;
  if (cursor !== "") url += "?cursor=" + cursor;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Request failed: GET ${url}`);
  return await resp.json() as { values: T[]; cursor: string };
}
