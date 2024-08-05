// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
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
