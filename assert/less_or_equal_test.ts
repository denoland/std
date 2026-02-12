// Copyright 2018-2026 the Deno authors. MIT license.
import { assertLessOrEqual, assertThrows } from "./mod.ts";

Deno.test("assertLessOrEqual", () => {
  assertLessOrEqual(1, 2);
  assertLessOrEqual(1n, 1n);

  assertThrows(() => assertLessOrEqual(2, 1));
});
