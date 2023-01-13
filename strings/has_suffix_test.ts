// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { hasSuffix } from "./has_suffix.ts";

Deno.test("[STRINGS] hasPrefix", () => {
  assertEquals(hasSuffix("Calvin", "in"), true);
  assertEquals(hasSuffix("Calvin", "n"), true);
  assertEquals(hasSuffix("Calvin", ""), true);
  assertEquals(hasSuffix("Calvin", "Cal"), false);
  assertEquals(hasSuffix("", "foo"), false);
  assertEquals(hasSuffix("Hobbes", "obb"), false);
  assertEquals(hasSuffix("Hobbes", "es"), true);
});
