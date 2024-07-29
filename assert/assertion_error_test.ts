// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, AssertionError, assertIsError } from "./mod.ts";

Deno.test("AssertionError", () => {
  const error = new AssertionError("foo", { cause: { bar: "baz" } });
  assertIsError(error, AssertionError, "foo");
  assertEquals(error.cause, { bar: "baz" });
});
