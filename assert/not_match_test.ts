// Copyright 2018-2025 the Deno authors. MIT license.
import { AssertionError, assertNotMatch, assertThrows } from "./mod.ts";

Deno.test("assertNotMatch()", () => {
  assertNotMatch("foobar.deno.com", RegExp(/[a-zA-Z]+@[a-zA-Z]+.com/));
});

Deno.test("assertNotMatch() throws", () => {
  assertThrows(
    () => assertNotMatch("Denosaurus from Jurassic", RegExp(/from/)),
    AssertionError,
    `Expected actual: "Denosaurus from Jurassic" to not match: "/from/".`,
  );
});

Deno.test("assertNotMatch() throws with custom message", () => {
  assertThrows(
    () =>
      assertNotMatch(
        "Denosaurus from Jurassic",
        RegExp(/from/),
        "CUSTOM MESSAGE",
      ),
    AssertionError,
    `Expected actual: "Denosaurus from Jurassic" to not match: "/from/": CUSTOM MESSAGE`,
  );
});
