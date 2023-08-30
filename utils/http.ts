// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RedirectStatus, Status } from "std/http/http_status.ts";

export async function fetchValues<T>(endpoint: string, cursor: string) {
  let url = endpoint;
  if (cursor !== "") url += "?cursor=" + cursor;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Request failed: GET ${url}`);
  return await resp.json() as { values: T[]; cursor: string };
}

/**
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

export function isValidUrl(string: string): boolean {
  try {
    const { protocol } = new URL(string);
    return protocol.startsWith("http");
  } catch {
    return false;
  }
}

export function isPublicUrl(string: string): boolean {
  try {
    const { hostname } = new URL(string);
    const ranges = [
      /^localhost$/,
      /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^::1$/,
      /^0:0:0:0:0:0:0:1$/,
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
      /^192\.168\.\d{1,3}\.\d{1,3}$/,
    ];

    return !ranges.some((range) => range.test(hostname));
  } catch (_) {
    return false;
  }
}
