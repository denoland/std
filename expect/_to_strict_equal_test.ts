// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "../assert/mod.ts";

Deno.test("expect().toStrictEqual()", () => {
  expect(1).toStrictEqual(1);
  expect({ a: 1 }).toStrictEqual({ a: 1 });

  expect(1).not.toStrictEqual(2);
  expect({ a: 2 }).not.toStrictEqual({ a: 1 });
  expect({ a: 1, b: undefined }).not.toStrictEqual({ a: 1 });

  assertThrows(() => {
    expect(1).toStrictEqual(2);
  }, AssertionError);
  assertThrows(() => {
    expect({ a: 2 }).toStrictEqual({ a: 1 });
  }, AssertionError);
  assertThrows(() => {
    expect({ a: 1, b: undefined }).toStrictEqual({ a: 1 });
  }, AssertionError);

  assertThrows(() => {
    expect(1).not.toStrictEqual(1);
  }, AssertionError);
  assertThrows(() => {
    expect({ a: 1 }).not.toStrictEqual({ a: 1 });
  }, AssertionError);
});
