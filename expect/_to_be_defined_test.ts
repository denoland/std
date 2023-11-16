// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "../assert/mod.ts";

Deno.test("expect().toBeDefined()", () => {
  expect(1).toBeDefined();
  expect("a").toBeDefined();

  assertThrows(() => {
    expect(undefined).toBeDefined();
  }, AssertionError);
  assertThrows(() => {
    // deno-lint-ignore no-explicit-any
    expect(({} as any).foo).toBeDefined();
  }, AssertionError);
});
