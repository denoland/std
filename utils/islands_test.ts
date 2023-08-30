// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { getCursor } from "./http.ts";
import { assertEquals } from "std/testing/asserts.ts";

Deno.test("[http] getCursor()", () => {
  assertEquals(getCursor(new URL("http://example.com")), "");
  assertEquals(getCursor(new URL("http://example.com?cursor=here")), "here");
});
