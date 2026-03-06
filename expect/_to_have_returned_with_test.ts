// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { fn } from "./fn.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toHaveReturnedWith()", () => {
  const mockFn = fn((x: number) => ({ foo: x + 1 }));

  mockFn(5);
  mockFn(6);

  expect(mockFn).toHaveReturnedWith({ foo: 7 });

  expect(mockFn).not.toHaveReturnedWith({ foo: 5 });

  assertThrows(() => {
    expect(mockFn).toHaveReturnedWith({ foo: 5 });
  }, AssertionError);

  assertThrows(() => {
    expect(mockFn).not.toHaveReturnedWith({ foo: 7 });
  }, AssertionError);
});

Deno.test("expect().toHaveReturnedWith() with custom error message", () => {
  const msg = "toHaveReturnedWith custom error message";
  const mockFn = fn((x: number) => ({ foo: x + 1 }));

  mockFn(5);
  mockFn(6);

  expect(() => expect(mockFn, msg).toHaveReturnedWith({ foo: 5 })).toThrow(
    new RegExp(`^${msg}`),
  );

  expect(() => expect(mockFn, msg).not.toHaveReturnedWith({ foo: 7 })).toThrow(
    new RegExp(`^${msg}`),
  );
});
