// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { compare } from "./compare.ts";

Deno.test("[STRINGS] compare_strings", () => {
  assertEquals(compare("a", "b"), -1);
  assertEquals(compare("a", "a"), 0);
  assertEquals(compare("b", "a"), 1);
});
