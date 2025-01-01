// Copyright 2018-2025 the Deno authors. MIT license.
import { assertLess, assertThrows } from "./mod.ts";

Deno.test("assertLess", () => {
  assertLess(1, 2);
  assertLess(1n, 2n);
  assertLess(1, 1.1);

  assertThrows(() => assertLess(2, 1));
});
