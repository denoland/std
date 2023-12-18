// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertAlmostEquals, AssertionError, assertThrows } from "./mod.ts";

Deno.test("assertAlmostEquals() matches values within default precision range", () => {
  assertAlmostEquals(-0, +0);
  assertAlmostEquals(Math.PI, Math.PI);
  assertAlmostEquals(0.1 + 0.2, 0.3);
  assertAlmostEquals(NaN, NaN);
  assertAlmostEquals(Number.NaN, Number.NaN);
});

Deno.test("assertAlmostEquals() throws values outside default precision range", () => {
  assertThrows(() => assertAlmostEquals(1, 2));
  assertThrows(() => assertAlmostEquals(1, 1.1));
});

Deno.test("assertAlmostEquals() matches values within higher precision range", () => {
  assertAlmostEquals(0.1 + 0.2, 0.3, 1e-16);
});

Deno.test("assertAlmostEquals() throws values outside higher precision range", () => {
  assertThrows(
    () => assertAlmostEquals(0.1 + 0.2, 0.3, 1e-17),
    AssertionError,
    `Expected actual: "${
      (
        0.1 + 0.2
      ).toExponential()
    }" to be close to "${(0.3).toExponential()}"`,
  );
});

Deno.test("assertAlmostEquals() matches infinity with inifinity", () => {
  assertAlmostEquals(Infinity, Infinity);
});

Deno.test("assertAlmostEquals() throws when special numbers do not match", () => {
  assertThrows(
    () => assertAlmostEquals(0, Infinity),
    AssertionError,
    'Expected actual: "0" to be close to "Infinity"',
  );
  assertThrows(
    () => assertAlmostEquals(-Infinity, +Infinity),
    AssertionError,
    'Expected actual: "-Infinity" to be close to "Infinity"',
  );
  assertThrows(
    () => assertAlmostEquals(Infinity, NaN),
    AssertionError,
    'Expected actual: "Infinity" to be close to "NaN"',
  );
});
