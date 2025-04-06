// Copyright 2018-2025 the Deno authors. MIT license.
import { AssertionError, assertIsError, assertStrictEquals } from "./mod.ts";

Deno.test("AssertionError", () => {
  const errorCause = { bar: "baz" };
  const error = new AssertionError("Foo", { cause: errorCause });
  assertIsError(error, AssertionError, "Foo");
  assertStrictEquals(error.cause, errorCause);
});
