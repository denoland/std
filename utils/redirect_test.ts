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

  const response = redirect(location);
  assert(!response.ok);
  assertEquals(response.body, null);
  assertEquals(response.headers.get("location"), location);
  assertEquals(response.status, 303);
});

Deno.test("[redirect] redirect()", () => {
  const location = "/hello-there";
  const status = 302;

  const response = redirect(location, status);
  assert(!response.ok);
  assertEquals(response.body, null);
  assertEquals(response.headers.get("location"), location);
  assertEquals(response.status, status);
});

Deno.test("[redirect] redirectToLogin()", () => {
  const from = "/hello-there";
  const response = redirectToLogin(from);
  const location = `/signin?from=${from}`;
  assert(!response.ok);
  assertEquals(response.body, null);
  assertEquals(response.headers.get("location"), location);
  assertEquals(response.status, 303);
});

Deno.test("[redirect] setRedirectUrlCookie()", () => {
  const redirectUrl = "/hello-there";
  const request = new Request(`http://example.com/signin?from=${redirectUrl}`);
  const response = new Response();
  setRedirectUrlCookie(request, response);
  const cookieHeader = response.headers.get("set-cookie");
  assertEquals(
    cookieHeader,
    `${REDIRECT_URL_COOKIE_NAME}=${redirectUrl}; Path=/`,
  );
});

Deno.test("[redirect] getRedirectUrlCookie()", () => {
  const headers = new Headers();
  const redirectUrl = "/hello-there";
  headers.set("Cookie", `${REDIRECT_URL_COOKIE_NAME}=${redirectUrl}`);
  assertEquals(getRedirectUrlCookie(headers), redirectUrl);
});

Deno.test("[redirect] deleteRedirectUrlCookie()", () => {
  const redirectUrl = "/hello-there";
  const request = new Request(`http://example.com/signin?from=${redirectUrl}`);
  const response = new Response();
  setRedirectUrlCookie(request, response);
  assert(
    !response.headers.get("set-cookie")?.includes(
      `${REDIRECT_URL_COOKIE_NAME}=;`,
    ),
  );
  deleteRedirectUrlCookie(response.headers);
  assert(
    response.headers.get("set-cookie")?.includes(
      `${REDIRECT_URL_COOKIE_NAME}=;`,
    ),
  );
});
