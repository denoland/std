// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { AssertionError, assertThrows, unreachable } from "./mod.ts";

Deno.test("unreachable()", () => {
  assertThrows(() => unreachable(), AssertionError, "unreachable");
  assertThrows(
    () => unreachable("custom message"),
    AssertionError,
    "custom message",
  );
});
