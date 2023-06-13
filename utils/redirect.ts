// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RedirectStatus, Status } from "std/http/http_status.ts";
import { deleteCookie, getCookies, setCookie } from "std/http/cookie.ts";

export const REDIRECT_URL_COOKIE_NAME = "redirect-url";

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

export function redirectToLogin(url: string) {
  return redirect(`/signin?from=${url}`);
}

export function setRedirectUrlCookie(req: Request, res: Response) {
  const from = new URL(req.url).searchParams.get("from");
  setCookie(res.headers, {
    name: REDIRECT_URL_COOKIE_NAME,
    value: from ?? req.headers.get("referer")!,
    path: "/",
  });
}

export function deleteRedirectUrlCookie(headers: Headers) {
  deleteCookie(headers, REDIRECT_URL_COOKIE_NAME);
}

export function getRedirectUrlCookie(headers: Headers) {
  return getCookies(headers)[REDIRECT_URL_COOKIE_NAME];
}
