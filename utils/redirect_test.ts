// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  deleteRedirectUrlCookie,
  getRedirectUrlCookie,
  redirect,
  REDIRECT_URL_COOKIE_NAME,
  redirectToLogin,
  setRedirectUrlCookie,
} from "./redirect.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";

Deno.test("[redirect] redirect() defaults", () => {
  const location = "/hello-there";

  const resp = redirect(location);
  assert(!resp.ok);
  assertEquals(resp.body, null);
  assertEquals(resp.headers.get("location"), location);
  assertEquals(resp.status, 303);
});

Deno.test("[redirect] redirect()", () => {
  const location = "/hello-there";
  const status = 302;

  const resp = redirect(location, status);
  assert(!resp.ok);
  assertEquals(resp.body, null);
  assertEquals(resp.headers.get("location"), location);
  assertEquals(resp.status, status);
});

Deno.test("[redirect] redirectToLogin()", () => {
  const from = "/hello-there";
  const resp = redirectToLogin(from);
  const location = `/signin?from=${from}`;
  assert(!resp.ok);
  assertEquals(resp.body, null);
  assertEquals(resp.headers.get("location"), location);
  assertEquals(resp.status, 303);
});

Deno.test("[redirect] setRedirectUrlCookie()", () => {
  const redirectUrl = "/hello-there";
  const req = new Request(`http://example.com/signin?from=${redirectUrl}`);
  const resp = new Response();
  setRedirectUrlCookie(req, resp);
  const cookieHeader = resp.headers.get("set-cookie");
  assertEquals(
    cookieHeader,
    `${REDIRECT_URL_COOKIE_NAME}=${redirectUrl}; Path=/`,
  );
});

Deno.test("[redirect] setRedirectUrlCookie() w/o searchParams", () => {
  const referer = "/hello-there";
  const req = new Request("http://example.com/signin", {
    headers: { Referer: referer },
  });
  const resp = new Response();
  setRedirectUrlCookie(req, resp);
  const cookieHeader = resp.headers.get("set-cookie");
  assertEquals(cookieHeader, `${REDIRECT_URL_COOKIE_NAME}=${referer}; Path=/`);
});

Deno.test("[redirect] getRedirectUrlCookie()", () => {
  const headers = new Headers();
  const redirectUrl = "/hello-there";
  headers.set("Cookie", `${REDIRECT_URL_COOKIE_NAME}=${redirectUrl}`);
  assertEquals(getRedirectUrlCookie(headers), redirectUrl);
});

Deno.test("[redirect] deleteRedirectUrlCookie()", () => {
  const redirectUrl = "/hello-there";
  const req = new Request(`http://example.com/signin?from=${redirectUrl}`);
  const resp = new Response();
  setRedirectUrlCookie(req, resp);
  assert(
    !resp.headers
      .get("set-cookie")
      ?.includes(`${REDIRECT_URL_COOKIE_NAME}=;`),
  );
  deleteRedirectUrlCookie(resp.headers);
  assert(
    resp.headers
      .get("set-cookie")
      ?.includes(`${REDIRECT_URL_COOKIE_NAME}=;`),
  );
});
