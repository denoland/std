// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { redirect } from "./http.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";

Deno.test("[http] redirect() defaults", () => {
  const location = "/hello-there";

  const response = redirect(location);
  assert(!response.ok);
  assertEquals(response.body, null);
  assertEquals(response.headers.get("location"), location);
  assertEquals(response.status, 303);
});

Deno.test("[http] redirect()", () => {
  const location = "/hello-there";
  const status = 302;

  const response = redirect(location, status);
  assert(!response.ok);
  assertEquals(response.body, null);
  assertEquals(response.headers.get("location"), location);
  assertEquals(response.status, status);
});
