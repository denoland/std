// Copyright 2018-2025 the Deno authors. MIT license.
import { AssertionError, assertThrows, unimplemented } from "./mod.ts";

Deno.test("unimplemented() throws", function () {
  assertThrows(() => unimplemented(), AssertionError, "Unimplemented.");
});

Deno.test("unimplemented() throws with custom message", function () {
  assertThrows(
    () => unimplemented("CUSTOM MESSAGE"),
    AssertionError,
    "Unimplemented: CUSTOM MESSAGE",
  );
});
