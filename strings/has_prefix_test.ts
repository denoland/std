// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { hasPrefix } from "./has_prefix.ts";

Deno.test("[STRINGS] hasPrefix", () => {
  assertEquals(hasPrefix("Deno", "De"), true);
  assertEquals(hasPrefix("Deno", "C"), false);
  assertEquals(hasPrefix("Deno", ""), true);
  assertEquals(hasPrefix("Deno", "d"), false);
});
