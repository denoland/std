// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertFalse, assertThrows } from "./mod.ts";

Deno.test("assertFalse() matches with falsy values", () => {
  assertFalse(false);
  assertFalse(0);
  assertFalse("");
  assertFalse(null);
  assertFalse(undefined);
});

Deno.test("assertFalse() throws with truthy values", () => {
  assertThrows(() => assertFalse(true));
  assertThrows(() => assertFalse(1));
  assertThrows(() => assertFalse("a"));
  assertThrows(() => assertFalse({}));
  assertThrows(() => assertFalse([]));
});
