// Copyright 2018-2026 the Deno authors. MIT license.
import { equals } from "./equals.ts";
import { assert, assertEquals, assertNotEquals } from "@std/assert";

Deno.test("equals()", async (t) => {
  await t.step("`true` where `a` and `b` are identical", () => {
    assert(equals(
      new Uint8Array([0, 1, 2, 3]),
      new Uint8Array([0, 1, 2, 3]),
    ));
  });
  await t.step("`false` where last byte differs", () => {
    assert(
      !equals(
        new Uint8Array([0, 1, 2, 3]),
        new Uint8Array([0, 1, 2, 255]),
      ),
    );
  });
  await t.step("`false` where `b` is a truncated version of `a`", () => {
    assert(
      !equals(
        new Uint8Array([0, 1, 2, 0]),
        new Uint8Array([0, 1, 2]),
      ),
    );
  });
  await t.step("`false` where `a` is a truncated version of `b`", () => {
    assert(
      !equals(
        new Uint8Array([0, 1, 2]),
        new Uint8Array([0, 1, 2, 0]),
      ),
    );
  });
});

const THRESHOLD_32_BIT = 160;

Deno.test("equals() handles randomized testing", () => {
  // run tests before and after cutoff
  for (let len = THRESHOLD_32_BIT - 10; len <= THRESHOLD_32_BIT + 10; len++) {
    const arr1 = crypto.getRandomValues(new Uint8Array(len));
    const arr2 = crypto.getRandomValues(new Uint8Array(len));
    const arr3 = arr1.slice(0);
    // the chance of arr1 equaling arr2 is basically 0
    // but introduce an inequality at the end just in case
    arr2[arr2.length - 1]! = arr1.at(-1)! ^ 1;
    // arr3 is arr1 but with an inequality in the very last element
    // this is to test the equality check when length isn't a multiple of 4
    arr3[arr3.length - 1]! ^= 1;
    // arrays with same underlying ArrayBuffer should be equal
    assert(equals(arr1, arr1));
    // equal arrays with different underlying ArrayBuffers should be equal
    assert(equals(arr1, arr1.slice(0)));
    // inequal arrays should be inequal
    assert(!equals(arr1, arr2));
    assert(!equals(arr1, arr3));
  }
});

// https://github.com/denoland/std/issues/3603
Deno.test("equals() works with .subarray()", () => {
  const a = new Uint8Array(1001).subarray(1);
  const b = new Uint8Array(1000);
  a[0] = 123;
  b[0] = 123;
  assertEquals(a, b);
  assert(equals(a, b));

  const c = new Uint8Array(1001).subarray(1);
  const d = new Uint8Array(1000);
  c[999] = 123;
  assertNotEquals(c, d); // ok
  assert(!equals(c, d));

  // Test every length/offset combination (modulo 4) to ensure that every byte is checked.
  for (let offsetA = 0; offsetA < 4; offsetA++) {
    for (let offsetB = 0; offsetB < 4; offsetB++) {
      for (let len = THRESHOLD_32_BIT; len < THRESHOLD_32_BIT + 4; len++) {
        const x = new Uint8Array(new ArrayBuffer(len + offsetA), offsetA);
        const y = new Uint8Array(new ArrayBuffer(len + offsetB), offsetB);
        for (let i = 0; i < len; i++) {
          assert(equals(x, y));
          x[i] = 1;
          assert(!equals(x, y));
          y[i] = 1;
        }
      }
    }
  }
});
