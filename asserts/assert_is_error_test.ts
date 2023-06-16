// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { AssertionError, assertIsError, assertThrows } from "./mod.ts";

Deno.test("Assert Is Error Non-Error Fail", () => {
  assertThrows(
    () => assertIsError("Panic!", undefined, "Panic!"),
    AssertionError,
    `Expected "error" to be an Error object.`,
  );

  assertThrows(
    () => assertIsError(null),
    AssertionError,
    `Expected "error" to be an Error object.`,
  );

  assertThrows(
    () => assertIsError(undefined),
    AssertionError,
    `Expected "error" to be an Error object.`,
  );
});

Deno.test("Assert Is Error Parent Error", () => {
  assertIsError(new AssertionError("Fail!"), Error, "Fail!");
});

Deno.test("Assert Is Error with custom Error", () => {
  class CustomError extends Error {}
  class AnotherCustomError extends Error {}
  assertIsError(new CustomError("failed"), CustomError, "fail");
  assertThrows(
    () => assertIsError(new AnotherCustomError("failed"), CustomError, "fail"),
    AssertionError,
    'Expected error to be instance of "CustomError", but was "AnotherCustomError".',
  );
});
