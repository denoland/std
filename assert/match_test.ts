// Copyright 2018-2025 the Deno authors. MIT license.
import { assertThrows } from "./throws.ts";
import { AssertionError, assertMatch } from "./mod.ts";

Deno.test("assertMatch()", () => {
  assertMatch("foobar@deno.com", RegExp(/[a-zA-Z]+@[a-zA-Z]+.com/));
});

Deno.test("assertMatch() throws", () => {
  assertThrows(
    () => assertMatch("Denosaurus from Jurassic", RegExp(/Raptor/)),
    AssertionError,
    `Expected actual: "Denosaurus from Jurassic" to match: "/Raptor/".`,
  );
});

Deno.test("assertMatch() throws with custom message", () => {
  assertThrows(
    () =>
      assertMatch(
        "Denosaurus from Jurassic",
        RegExp(/Raptor/),
        "CUSTOM MESSAGE",
      ),
    AssertionError,
    `Expected actual: "Denosaurus from Jurassic" to match: "/Raptor/": CUSTOM MESSAGE`,
  );
});
