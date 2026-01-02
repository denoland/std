// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { binarySearch } from "./unstable_binary_search.ts";
import { assertSpyCalls, spy } from "@std/testing/mock";

Deno.test("binarySearch() gives exact or non-exact indexes", async (t) => {
  await t.step("examples", () => {
    assertEquals(binarySearch([0, 1], 0), 0);
    assertEquals(binarySearch([0, 1], 1), 1);
    assertEquals(binarySearch([0, 1], -0.5), -1); // -1 == ~0 (bitwise complement)
    assertEquals(binarySearch([0, 1], 0.5), -2); // -2 == ~1 (bitwise complement)
    assertEquals(binarySearch([0, 1], 1.5), -3); // -3 == ~2 (bitwise complement)
  });

  await t.step("0 elements", () => {
    const arr: number[] = [];
    assertEquals(binarySearch(arr, -1), -1);
    assertEquals(binarySearch(arr, 0), -1);
    assertEquals(binarySearch(arr, 1), -1);
  });

  await t.step("1 element", () => {
    const arr = [0];
    assertEquals(binarySearch(arr, -1), -1);
    assertEquals(binarySearch(arr, 0), 0);
    assertEquals(binarySearch(arr, 1), -2);
  });

  await t.step("even number of elements", () => {
    const arr = [0, 1];
    assertEquals(binarySearch(arr, -1), -1);
    assertEquals(binarySearch(arr, -0.5), -1);
    assertEquals(binarySearch(arr, 0), 0);
    assertEquals(binarySearch(arr, 0.5), -2);
    assertEquals(binarySearch(arr, 1), 1);
    assertEquals(binarySearch(arr, 1.5), -3);
    assertEquals(binarySearch(arr, 2), -3);
  });

  await t.step("odd number of elements", () => {
    const arr = [0, 1, 2];
    assertEquals(binarySearch(arr, -1), -1);
    assertEquals(binarySearch(arr, -0.5), -1);
    assertEquals(binarySearch(arr, 0), 0);
    assertEquals(binarySearch(arr, 0.5), -2);
    assertEquals(binarySearch(arr, 1), 1);
    assertEquals(binarySearch(arr, 1.5), -3);
    assertEquals(binarySearch(arr, 2), 2);
    assertEquals(binarySearch(arr, 2.5), -4);
    assertEquals(binarySearch(arr, 3), -4);
  });

  await t.step("bigints", () => {
    const arr = [0n, 1n, 3n];
    assertEquals(binarySearch(arr, -1n), -1);
    assertEquals(binarySearch(arr, 0n), 0);
    assertEquals(binarySearch(arr, 1n), 1);
    assertEquals(binarySearch(arr, 2n), -3);
    assertEquals(binarySearch(arr, 3n), 2);
  });

  await t.step("typed arrays", () => {
    const arr = new Int32Array([0, 1, 3]);
    assertEquals(binarySearch(arr, -1), -1);
    assertEquals(binarySearch(arr, 0), 0);
    assertEquals(binarySearch(arr, 1), 1);
    assertEquals(binarySearch(arr, 2), -3);
    assertEquals(binarySearch(arr, 3), 2);
  });

  await t.step("typing", () => {
    void (() => {
      // @ts-expect-error Argument of type 'number' is not assignable to parameter of type 'bigint'.
      binarySearch([0n], 0);
      // @ts-expect-error Argument of type 'bigint' is not assignable to parameter of type 'number'.
      binarySearch([0], 0n);

      // @ts-expect-error Argument of type 'undefined' is not assignable to parameter of type 'number'.
      binarySearch([0], undefined);
    });
  });

  await t.step("algorithm correctness - number of loop iterations", () => {
    /** `Math.floor` calls act as a proxy for the number of loop iterations, as it's called once per iteration */
    const spyLoopIterations = () => spy(Math, "floor");

    const arr = Array.from({ length: 1_000_000 }, (_, i) => i);

    {
      using iterations = spyLoopIterations();
      const searchVal = 499_999;
      const result = binarySearch(arr, searchVal);

      assertEquals(result, 499_999);
      assertSpyCalls(iterations, 1);
    }

    {
      using iterations = spyLoopIterations();
      const searchVal = 499_999.1;
      const result = binarySearch(arr, searchVal);

      assertEquals(result, -500_001);
      assertSpyCalls(iterations, 19);
    }
  });
});
