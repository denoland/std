// Copyright 2018-2025 the Deno authors. MIT license.
import { AssertionError, assertIsError, assertThrows } from "./mod.ts";

class CustomError extends Error {}
class AnotherCustomError extends Error {}

Deno.test("assertIsError() throws when given value isn't error", () => {
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

Deno.test("assertIsError() allows subclass of Error", () => {
  assertIsError(new AssertionError("Fail!"), Error, "Fail!");
});

Deno.test("assertIsError() allows custom error", () => {
  assertIsError(new CustomError("Failed"), CustomError, "Fail");
  assertThrows(
    () => assertIsError(new AnotherCustomError("Failed"), CustomError, "Fail"),
    AssertionError,
    'Expected error to be instance of "CustomError", but was "AnotherCustomError".',
  );
});

Deno.test("assertIsError() accepts abstract class", () => {
  abstract class AbstractError extends Error {}
  class ConcreteError extends AbstractError {}

  assertIsError(new ConcreteError("Failed"), AbstractError, "Fail");
});

Deno.test("assertIsError() throws with message diff containing double quotes", () => {
  assertThrows(
    () =>
      assertIsError(
        new CustomError('Error with "double quotes"'),
        CustomError,
        'doesn\'t include "this message"',
      ),
    AssertionError,
    `Expected error message to include "doesn't include \\"this message\\"", but got "Error with \\"double quotes\\"".`,
  );
});

Deno.test("assertIsError() throws when given value doesn't match regex ", () => {
  assertIsError(new AssertionError("Regex test"), Error, /ege/);
  assertThrows(
    () => assertIsError(new AssertionError("Regex test"), Error, /egg/),
    Error,
    `Expected error message to include /egg/, but got "Regex test"`,
  );
});

Deno.test("assertIsError() throws with custom message", () => {
  assertThrows(
    () =>
      assertIsError(
        new CustomError("Failed"),
        AnotherCustomError,
        "Fail",
        "CUSTOM MESSAGE",
      ),
    AssertionError,
    'Expected error to be instance of "AnotherCustomError", but was "CustomError": CUSTOM MESSAGE',
  );
});
