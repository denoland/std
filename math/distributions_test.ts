import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertExists,
} from "../testing/asserts.ts";

import { normalDistribution, uniformRange } from "./distributions.ts";

Deno.test({
  name: "uniformRange function exists",
  fn() {
    assertExists(uniformRange);
  },
});

Deno.test({
  name: "10 evenly distributed from 1 to 10 include all integers from 1 to 10.",
  fn() {
    assertEquals(uniformRange(10, { min: 1, max: 10 }), [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
    ]);
  },
});

Deno.test({
  name: "11 evenly distributed from 0 to 10 include all integers from 0 to 10.",
  fn() {
    assertEquals(uniformRange(11, { min: 0, max: 10 }), [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
    ]);
  },
});

Deno.test({
  name: "Negative, zero, non-integer value of n returns an empty array.",
  fn() {
    assertEquals(uniformRange(-10, { min: 1, max: 10 }).length, 0);
    assertEquals(uniformRange(3.14, { min: 1, max: 10 }).length, 0);
    // @ts-ignore use null in a place where you shouldn't
    assertEquals(uniformRange(null, { min: 1, max: 10 }).length, 0);
  },
});

Deno.test({
  name: "normalDistribution function exists",
  fn() {
    assertExists(normalDistribution);
  },
});

Deno.test({
  name: "Normal distribution of 100 elements contains 100 numbers.",
  fn() {
    assertEquals(normalDistribution(100, 10, 0.03).length, 100);
  },
});

Deno.test({
  name:
    "Normal distribution of 100 elements with very small variance gives all values close to mean.",
  fn() {
    normalDistribution(100, 1, 1e-7).forEach((x) =>
      assertAlmostEquals(x, 1, 1e-4)
    );
  },
});

Deno.test({
  name: "Normal distribution has all values within +- standard deviation.",
  fn() {
    function withNElements(n: number) {
      normalDistribution(n, 1, 1e-2).forEach((val) =>
        assert(val < 1 + Math.sqrt(1e-2) && val > 1 - Math.sqrt(1e-2))
      );
    }
    withNElements(1e1);
    withNElements(1e2);
    withNElements(1e3);
    withNElements(1e4);
    withNElements(1e5);
    withNElements(1e6);
  },
});
