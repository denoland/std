// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { toLower } from "./to_lower.ts";

Deno.test("[STRINGS] is_lower_case", () => {
  const k = "Hello, Deno!";
  const y = "hello calvin!";

  assertEquals(toLower(k), "hello, deno!");
  assertEquals(toLower(y), "hello calvin!");
});
