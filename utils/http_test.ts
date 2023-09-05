// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { getCursor, redirect } from "./http.ts";
import { assert, assertEquals } from "std/assert/mod.ts";

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

Deno.test("[http] getCursor()", () => {
  assertEquals(getCursor(new URL("http://example.com")), "");
  assertEquals(getCursor(new URL("http://example.com?cursor=here")), "here");
});
