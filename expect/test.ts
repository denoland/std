// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertRejects, assertThrows } from "@std/assert";

Deno.test("expect().resolves.toEqual()", async () => {
  await expect(Promise.resolve(42)).resolves.toEqual(42);
  await expect(Promise.resolve(42)).resolves.not.toEqual(0);

  assertThrows(
    () => expect(42).resolves.toEqual(42),
    AssertionError,
    "Expected value must be PromiseLike",
  );
  assertThrows(
    () => expect(null).resolves.toEqual(42),
    AssertionError,
    "Expected value must be PromiseLike",
  );
});

Deno.test("expect().rejects.toEqual()", async () => {
  await expect(Promise.reject(42)).rejects.toEqual(42);
  await expect(Promise.reject(42)).rejects.not.toEqual(0);

  assertThrows(
    () => expect(42).rejects.toEqual(42),
    AssertionError,
    "Expected value must be a PromiseLike",
  );
  await assertRejects(
    () => expect(Promise.resolve(42)).rejects.toEqual(42),
    AssertionError,
    "Promise did not reject: resolved to 42",
  );
});

Deno.test("expect()[nonExistentMatcher]()", () => {
  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => (expect(() => {}) as any)["nonExistentMatcher"](),
    TypeError,
    "matcher not found: nonExistentMatcher",
  );
  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => (expect(() => {}) as any)[Symbol()](),
    TypeError,
    "matcher not found",
  );
});
