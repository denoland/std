// Copyright 2018-2026 the Deno authors. MIT license.
import { AssertionError, assertThrows, fail } from "./mod.ts";

Deno.test("AssertFail", function () {
  assertThrows(fail, AssertionError, "Failed assertion.");
  assertThrows(
    () => {
      fail("foo");
    },
    AssertionError,
    "Failed assertion: foo",
  );
});
