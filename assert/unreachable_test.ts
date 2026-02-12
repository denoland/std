// Copyright 2018-2026 the Deno authors. MIT license.
import { AssertionError, assertThrows, unreachable } from "./mod.ts";

Deno.test("unreachable()", () => {
  assertThrows(() => unreachable(), AssertionError, "Unreachable.");
  assertThrows(
    () => unreachable("custom message"),
    AssertionError,
    "Unreachable: custom message",
  );
});
