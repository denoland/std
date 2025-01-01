// Copyright 2018-2025 the Deno authors. MIT license.
import {
  assert,
  assertEquals,
  AssertionError,
  assertStringIncludes,
  assertThrows,
} from "./mod.ts";

Deno.test("assertStringIncludes()", () => {
  assertStringIncludes("Denosaurus", "saur");
  assertStringIncludes("Denosaurus", "Deno");
  assertStringIncludes("Denosaurus", "rus");
  let didThrow;
  try {
    assertStringIncludes("Denosaurus", "Raptor");
    didThrow = false;
  } catch (e) {
    assert(e instanceof AssertionError);
    didThrow = true;
  }
  assertEquals(didThrow, true);
});

Deno.test("assertStringIncludes() throws", () => {
  assertThrows(
    () => assertStringIncludes("Denosaurus from Jurassic", "Raptor"),
    AssertionError,
    `Expected actual: "Denosaurus from Jurassic" to contain: "Raptor".`,
  );
});

Deno.test("assertStringIncludes() with custom message", () => {
  assertThrows(
    () =>
      assertStringIncludes(
        "Denosaurus from Jurassic",
        "Raptor",
        "CUSTOM MESSAGE",
      ),
    AssertionError,
    `Expected actual: "Denosaurus from Jurassic" to contain: "Raptor": CUSTOM MESSAGE`,
  );
});
