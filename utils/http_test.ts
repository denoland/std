// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { isPublicUrl, isValidUrl, redirect } from "./http.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";

Deno.test("[http] redirect() defaults", () => {
  const location = "/hello-there";

  const resp = redirect(location);
  assert(!resp.ok);
  assertEquals(resp.body, null);
  assertEquals(resp.headers.get("location"), location);
  assertEquals(resp.status, 303);
});

Deno.test("[http] redirect()", () => {
  const location = "/hello-there";
  const status = 302;

  const resp = redirect(location, status);
  assert(!resp.ok);
  assertEquals(resp.body, null);
  assertEquals(resp.headers.get("location"), location);
  assertEquals(resp.status, status);
});

Deno.test("[http] isValidUrl()", () => {
  assertEquals(isValidUrl("https://hunt.deno.land/"), true);
  assertEquals(isValidUrl("http://hunt.deno.land/"), true);
  assertEquals(isValidUrl("ws://hunt.deno.land/"), false);
  assertEquals(isValidUrl("wss://hunt.deno.land/"), false);
  assertEquals(isValidUrl("invalidurl"), false);
});

Deno.test("[http] isPublicUrl()", () => {
  assertEquals(isPublicUrl("https://hunt.deno.land/"), true);
  assertEquals(isPublicUrl("http://hunt.deno.land/"), true);
  assertEquals(isPublicUrl("ws://hunt.deno.land/"), true);
  assertEquals(isPublicUrl("http://localhost/"), false);
  assertEquals(isPublicUrl("http://127.0.0.1/"), false);
  assertEquals(isPublicUrl("http://::1/"), false);
  assertEquals(isPublicUrl("http://10.0.0.0/"), false);
  assertEquals(isPublicUrl("http://172.16.0.0/"), false);
  assertEquals(isPublicUrl("http://192.168.0.0/"), false);
});
