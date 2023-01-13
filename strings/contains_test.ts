// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { contains } from "./contains.ts";

Deno.test("[STRINGS] contains_substring", () => {
  const k = "seafood";

  assertEquals(contains(k, "foo"), true);
  assertEquals(contains(k, "bar"), false);
  assertEquals(contains(k, ""), true);
  assertEquals(contains("", ""), true);
});
