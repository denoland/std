// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { RedirectStatus, STATUS_CODE } from "std/http/status.ts";

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
  status: typeof STATUS_CODE.Created | RedirectStatus = STATUS_CODE.SeeOther,
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

/**
 * Returns the values and cursor for the resource of a given endpoint. In the
 * backend, the request handler collects these values and cursor by iterating
 * through a {@linkcode Deno.KvListIterator}
 *
 * @example
 * ```ts
 * import { fetchValues } from "@/utils/http.ts";
 * import type { Item } from "@/utils/db.ts";
 *
 * const body = await fetchValues<Item>("https://hunt.deno.land/api/items", "12345");
 * body.values[0].id; // Returns "13f34b7e-5563-4001-98ed-9ee04d7af717"
 * body.values[0].url; // Returns "http://example.com"
 * body.cursor; // Returns "12346"
 * ```
 */
export async function fetchValues<T>(endpoint: string, cursor: string) {
  let url = endpoint;
  if (cursor !== "") url += "?cursor=" + cursor;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Request failed: GET ${url}`);
  return await resp.json() as { values: T[]; cursor: string };
}

export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class BadRequestError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "BadRequestError";
  }
}
