// Copyright 2018-2025 the Deno authors. MIT license.
import { AssertionError, assertIsError, assertStrictEquals } from "./mod.ts";

Deno.test("AssertionError", () => {
  const errorCause = { bar: "baz" };
  // deno-lint-ignore deno-style-guide/error-message
  const error = new AssertionError("foo", { cause: errorCause });
  assertIsError(error, AssertionError, "foo");
  assertStrictEquals(error.cause, errorCause);
});
