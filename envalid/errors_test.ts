// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import { EnvError, EnvMissingError } from "./mod.ts";

Deno.test("EnvError", () => {
  const e = new EnvError("baz");
  assertEquals(e instanceof EnvError, true);
  assertEquals(e instanceof TypeError, true);
  assertEquals(e.name, "EnvError");
});

Deno.test("EnvMissingError", () => {
  const e = new EnvMissingError("baz");
  assertEquals(e instanceof EnvMissingError, true);
  assertEquals(e instanceof ReferenceError, true);
  assertEquals(e.name, "EnvMissingError");
});
