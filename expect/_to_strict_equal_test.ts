// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

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

  class A {}
  class B {}
  expect(new A()).not.toStrictEqual(new B());
  assertThrows(() => {
    expect(new A()).toStrictEqual(new B());
  }, AssertionError);

  const ab = (...b: number[]) => new Uint8Array(b).buffer;
  expect(ab(1, 2)).toStrictEqual(ab(1, 2));
  expect(ab(1, 2)).not.toStrictEqual(ab(1, 3));
  assertThrows(() => {
    expect(ab(1, 2)).toStrictEqual(ab(1, 3));
  }, AssertionError);
  assertThrows(() => {
    expect({ b: ab(1) }).toStrictEqual({ b: ab(2) });
  }, AssertionError);

  expect(new DataView(ab(1, 2))).toStrictEqual(new DataView(ab(1, 2)));
  expect(new DataView(ab(1))).not.toStrictEqual(new DataView(ab(2)));
  assertThrows(() => {
    expect(new DataView(ab(1))).toStrictEqual(new DataView(ab(2)));
  }, AssertionError);

  expect(new Error("m")).toStrictEqual(new Error("m"));
  expect(new Error("m")).not.toStrictEqual(new TypeError("m"));
  assertThrows(() => {
    expect(new Error("m")).toStrictEqual(new TypeError("m"));
  }, AssertionError);

  expect(Object.assign(Object.create(null), { a: 1 })).not.toStrictEqual({
    a: 1,
  });
  assertThrows(() => {
    expect(Object.assign(Object.create(null), { a: 1 })).toStrictEqual({
      a: 1,
    });
  }, AssertionError);

  expect(new Number(1)).toStrictEqual(new Number(1));
  expect(new Number(1)).not.toStrictEqual(new Number(2));
  assertThrows(() => {
    expect(new Number(1)).toStrictEqual(new Number(2));
  }, AssertionError);

  expect(new Boolean(true)).toStrictEqual(new Boolean(true));
  expect(new Boolean(true)).not.toStrictEqual(new Boolean(false));
  assertThrows(() => {
    expect(new Boolean(true)).toStrictEqual(new Boolean(false));
  }, AssertionError);

  expect(Object(1n)).toStrictEqual(Object(1n));
  expect(Object(1n)).not.toStrictEqual(Object(2n));
  assertThrows(() => {
    expect(Object(1n)).toStrictEqual(Object(2n));
  }, AssertionError);

  expect(new Set([{ a: 1 }, { a: 2 }])).toStrictEqual(
    new Set([{ a: 2 }, { a: 1 }]),
  );
  expect(new Set([{ a: 1 }, { a: 1 }])).not.toStrictEqual(
    new Set([{ a: 1 }, { a: 2 }]),
  );
  assertThrows(() => {
    expect(new Set([{ a: 1 }, { a: 1 }])).toStrictEqual(
      new Set([{ a: 1 }, { a: 2 }]),
    );
  }, AssertionError);

  expect(new Map([[{ k: 1 }, 1], [{ k: 2 }, 2]])).toStrictEqual(
    new Map([[{ k: 2 }, 2], [{ k: 1 }, 1]]),
  );
  expect(new Map([[{ k: 1 }, 1], [{ k: 1 }, 1]])).not.toStrictEqual(
    new Map([[{ k: 1 }, 1], [{ k: 2 }, 1]]),
  );
  assertThrows(() => {
    expect(new Map([[{ k: 1 }, 1], [{ k: 1 }, 1]])).toStrictEqual(
      new Map([[{ k: 1 }, 1], [{ k: 2 }, 1]]),
    );
  }, AssertionError);
});
