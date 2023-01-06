// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertSpyCall, assertSpyCalls, spy } from "../mock.ts";
import { assertEquals } from "../asserts.ts";
import { multiply, square } from "./parameter_injection.ts";

Deno.test("square calls multiply and returns results", () => {
  const multiplySpy = spy(multiply);

  assertEquals(square(multiplySpy, 5), 25);

  // asserts that multiplySpy was called at least once and details about the first call.
  assertSpyCall(multiplySpy, 0, {
    args: [5, 5],
    returned: 25,
  });

  // asserts that multiplySpy was only called once.
  assertSpyCalls(multiplySpy, 1);
});
