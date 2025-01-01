// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import {
  assertSpyCall,
  assertSpyCallArg,
  assertSpyCallArgs,
  assertSpyCallAsync,
  assertSpyCalls,
  spy,
} from "@std/testing/unstable-mock";
import { expect } from "./unstable_expect.ts";
import { fn } from "./unstable_fn.ts";

Deno.test("@std/expect/fn should be compatible with @std/testing/mock asserts", async () => {
  const mockFn = fn((a: number, b: number) => a + b);
  mockFn(1, 1);
  mockFn(1, 2);

  assertSpyCalls(mockFn, 2);
  assertSpyCall(mockFn, 0, { args: [1, 1], returned: 2 });
  assertSpyCallArgs(mockFn, 1, [1, 2]);
  assertSpyCallArg(mockFn, 0, 0, 1);

  const mockAsyncFn = fn((a: number, b: number) => Promise.resolve(a + b));
  await mockAsyncFn(1, 1);
  await assertSpyCallAsync(mockAsyncFn, 0, {
    args: [1, 1],
    returned: 2,
  });
});

Deno.test("@std/testing/mock should be compatible with @std/expect", () => {
  const sum = (a: number, b: number) => a + b;

  const value = { sum };
  const methodFn = spy(value, "sum");
  value.sum(1, 1);
  expect(methodFn).toHaveBeenCalledWith(1, 1);
  expect(methodFn).toHaveReturnedWith(2);

  const spyFn = spy(sum);
  spyFn(1, 1);
  spyFn(1, 2);
  expect(spyFn).toHaveBeenCalledTimes(2);
  expect(spyFn).toHaveBeenLastCalledWith(1, 2);

  class A {}
  const constructorFn = spy(A);
  expect(new constructorFn()).toBeInstanceOf(A);
  expect(constructorFn).toHaveReturnedWith(expect.any(A));
});
