// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { assertPath } from "./assert_path.ts";

Deno.test("assertPath()", () => {
  assertEquals(assertPath(""), undefined);
  assertEquals(assertPath("foo"), undefined);
});

Deno.test("assertPath() throws", () => {
  assertThrows(
    () => assertPath(undefined),
    TypeError,
    "Path must be a string. Received undefined",
  );
});
