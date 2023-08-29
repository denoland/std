// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "std/testing/asserts.ts";
import { getCursor } from "./pagination.ts";

Deno.test("[pagaintion] getCursor()", () => {
  assertEquals(getCursor(new URL("http://example.com")), "");
  assertEquals(getCursor(new URL("http://example.com?cursor=here")), "here");
});
