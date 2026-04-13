// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";

class Cat {}
Deno.test("expect.any()", () => {
  expect(new Cat()).toEqual(expect.any(Cat));
  expect(new Cat()).toEqual(expect.any(Object));
  expect("Hello").toEqual(expect.any(String));
  expect(1).toEqual(expect.any(Number));
  expect(() => {}).toEqual(expect.any(Function));
  expect(false).toEqual(expect.any(Boolean));
  expect(BigInt(1)).toEqual(expect.any(BigInt));
  expect(Symbol("sym")).toEqual(expect.any(Symbol));
});
