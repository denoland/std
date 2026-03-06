// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toMatch()", () => {
  expect("hello deno").toMatch(/deno/);

  expect("hello deno").not.toMatch(/DENO/);

  assertThrows(() => {
    expect("hello deno").toMatch(/DENO/);
  }, AssertionError);

  assertThrows(() => {
    expect("hello deno").not.toMatch(/deno/);
  });
});
