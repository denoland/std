// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assert, assertFalse, assertThrows } from "@std/assert";
import {
  defineMockInternals,
  isMockFunction,
  MOCK_SYMBOL,
} from "./unstable_mock.ts";

Deno.test("defineMockInternals()", async ({ step }) => {
  await step("should define readonly MOCK_SYMBOL property", () => {
    const fn = () => {};
    defineMockInternals(fn);

    assert(MOCK_SYMBOL in fn, "MOCK_SYMBOL not in fn");
    assert(
      typeof fn[MOCK_SYMBOL] === "object" && fn[MOCK_SYMBOL] !== null,
      "fn[MOCK_SYMBOL] is not an object",
    );
    assert(
      "calls" in fn[MOCK_SYMBOL] && Array.isArray(fn[MOCK_SYMBOL].calls),
      "fn[MOCK_SYMBOL].calls is not an array",
    );
    assertThrows(
      () => {
        fn[MOCK_SYMBOL] = null;
      },
      TypeError,
      "",
      "fn[MOCK_SYMBOL] is not readonly",
    );
  });

  await step("should accept custom internals object", () => {
    const fn = defineMockInternals(() => {}, { test: true } as never);
    assert(
      "calls" in fn[MOCK_SYMBOL],
      "empty calls array should still be in fn[MOCK_SYMBOL]",
    );
    assert(
      "test" in fn[MOCK_SYMBOL] && fn[MOCK_SYMBOL].test === true,
      "test internals extension not found",
    );
  });
});

Deno.test("isMockFunction()", () => {
  assertFalse(
    isMockFunction(() => {}),
    "plane function should not be considerate as mock function",
  );
  assert(
    isMockFunction(defineMockInternals(() => {})),
    "function with internals should be considerate as mock function",
  );
});
