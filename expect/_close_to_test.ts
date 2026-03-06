// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";

Deno.test("expect.closeTo()", () => {
  expect(0.1 + 0.2).toEqual(expect.closeTo(0.3));
  expect(Math.PI).toEqual(expect.closeTo(3.14));
  expect(Number.POSITIVE_INFINITY).toEqual(
    expect.closeTo(Number.POSITIVE_INFINITY),
  );
  expect(Number.NEGATIVE_INFINITY).toEqual(
    expect.closeTo(Number.NEGATIVE_INFINITY),
  );

  expect(0.1 + 0.2).not.toEqual(expect.closeTo(0.3, 17));
  expect(0.999_999).not.toEqual(expect.closeTo(1, 10));
  expect(NaN).not.toEqual(expect.closeTo(NaN));
  expect(Number.POSITIVE_INFINITY).not.toEqual(
    expect.closeTo(Number.NEGATIVE_INFINITY),
  );
});
