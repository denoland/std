// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toBe()", () => {
  const obj = {};
  expect(1).toBe(1);
  expect("hello").toBe("hello");
  expect(obj).toBe(obj);

  expect(1).not.toBe(2);
  expect("hello").not.toBe("world");
  expect(obj).not.toBe({});

  assertThrows(() => {
    expect(1).toBe(2);
  }, AssertionError);
  assertThrows(() => {
    expect("hello").toBe("world");
  }, AssertionError);
  assertThrows(() => {
    expect(obj).toBe({});
  }, AssertionError);

  assertThrows(() => {
    expect(1).not.toBe(1);
  }, AssertionError);
  assertThrows(() => {
    expect("hello").not.toBe("hello");
  }, AssertionError);
  assertThrows(() => {
    expect(obj).not.toBe(obj);
  }, AssertionError);

  class A {}
  class B {}
  expect(new A()).not.toBe(new B());
  assertThrows(() => {
    expect(new A()).toBe(new B());
  }, AssertionError);
});
