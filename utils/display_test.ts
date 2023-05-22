// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { pluralize } from "./display.ts";
import { assertEquals } from "std/testing/asserts.ts";

Deno.test("[display] pluralize()", () => {
  assertEquals(pluralize(0, "item"), "0 items");
  assertEquals(pluralize(1, "item"), "1 item");
  assertEquals(pluralize(2, "item"), "2 items");
});
