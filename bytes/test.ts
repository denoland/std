// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  concat,
  copy,
  endsWith,
  equals,
  includesNeedle,
  indexOfNeedle,
  lastIndexOfNeedle,
  repeat,
  startsWith,
} from "./mod.ts";
import { assert, assertEquals, assertThrows } from "../testing/asserts.ts";

Deno.test("[bytes] indexOfNeedle1", () => {
  const i = indexOfNeedle(
    new Uint8Array([1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 3]),
    new Uint8Array([0, 1, 2]),
  );
  assertEquals(i, 2);
});

Deno.test("[bytes] indexOfNeedle2", () => {
  const i = indexOfNeedle(new Uint8Array([0, 0, 1]), new Uint8Array([0, 1]));
  assertEquals(i, 1);
});

Deno.test("[bytes] indexOfNeedle3", () => {
  const encoder = new TextEncoder();
  const i = indexOfNeedle(encoder.encode("Deno"), encoder.encode("D"));
  assertEquals(i, 0);
});

Deno.test("[bytes] indexOfNeedle4", () => {
  const i = indexOfNeedle(new Uint8Array(), new Uint8Array([0, 1]));
  assertEquals(i, -1);
});

Deno.test("[bytes] indexOfNeedle with start index", () => {
  const i = indexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    1,
  );
  assertEquals(i, 3);
});

Deno.test("[bytes] indexOfNeedle with start index 2", () => {
  const i = indexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    7,
  );
  assertEquals(i, -1);
});

Deno.test("[bytes] indexOfNeedle with start index < 0", () => {
  assertEquals(
    indexOfNeedle(
      new Uint8Array([0, 1, 2, 0, 1, 2]),
      new Uint8Array([0, 1]),
      3,
    ),
    3,
  );
  assertEquals(
    indexOfNeedle(
      new Uint8Array([0, 1, 2, 1, 1, 2]),
      new Uint8Array([0, 1]),
      3,
    ),
    -1,
  );
});

Deno.test("[bytes] lastIndexOfNeedle1", () => {
  const i = lastIndexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2, 0, 1, 3]),
    new Uint8Array([0, 1, 2]),
  );
  assertEquals(i, 3);
});

Deno.test("[bytes] lastIndexOfNeedle2", () => {
  const i = lastIndexOfNeedle(
    new Uint8Array([0, 1, 1]),
    new Uint8Array([0, 1]),
  );
  assertEquals(i, 0);
});

Deno.test("[bytes] lastIndexOfNeedle3", () => {
  const i = lastIndexOfNeedle(new Uint8Array(), new Uint8Array([0, 1]));
  assertEquals(i, -1);
});

Deno.test("[bytes] lastIndexOfNeedle with start index", () => {
  const i = lastIndexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    2,
  );
  assertEquals(i, 0);
});

Deno.test("[bytes] lastIndexOfNeedle with start index 2", () => {
  const i = lastIndexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    -1,
  );
  assertEquals(i, -1);
});

Deno.test("[bytes] equals", () => {
  const v = equals(new Uint8Array([0, 1, 2, 3]), new Uint8Array([0, 1, 2, 3]));
  const v2 = equals(new Uint8Array([0, 1, 2, 2]), new Uint8Array([0, 1, 2, 3]));
  const v3 = equals(new Uint8Array([0, 1, 2, 3]), new Uint8Array([0, 1, 2]));
  assert(v);
  assert(!v2);
  assert(!v3);
});

Deno.test("[bytes] equals randomized testing", () => {
  // run tests before and after cutoff
  for (let len = 995; len <= 1005; len++) {
    const arr1 = crypto.getRandomValues(new Uint8Array(len));
    const arr2 = crypto.getRandomValues(new Uint8Array(len));
    const arr3 = arr1.slice(0);
    // the chance of arr1 equaling arr2 is basically 0
    // but introduce an inequality at the end just in case
    arr2[arr2.length - 1] = arr1[arr1.length - 1] ^ 1;
    // arr3 is arr1 but with an inequality in the very last element
    // this is to test the equality check when length isn't a multiple of 4
    arr3[arr3.length - 1] ^= 1;
    // arrays with same underlying ArrayBuffer should be equal
    assert(equals(arr1, arr1));
    // equal arrays with different underlying ArrayBuffers should be equal
    assert(equals(arr1, arr1.slice(0)));
    // inequal arrays should be inequal
    assert(!equals(arr1, arr2));
    assert(!equals(arr1, arr3));
  }
});

Deno.test("[bytes] startsWith", () => {
  const v = startsWith(new Uint8Array([0, 1, 2]), new Uint8Array([0, 1]));
  const v2 = startsWith(new Uint8Array([0, 1, 2]), new Uint8Array([0, 2]));
  const v3 = startsWith(
    new Uint8Array([0, 1, 2]),
    new Uint8Array([0, 2, 3, 4]),
  );
  assert(v);
  assert(!v2);
  assert(!v3);
});

Deno.test("[bytes] endsWith", () => {
  const v = endsWith(new Uint8Array([0, 1, 2]), new Uint8Array([1, 2]));
  const v2 = endsWith(new Uint8Array([0, 1, 2]), new Uint8Array([0, 1]));
  const v3 = endsWith(new Uint8Array([0, 1, 2]), new Uint8Array([0, 1, 2, 3]));
  assert(v);
  assert(!v2);
  assert(!v3);
});

Deno.test("[bytes] repeat", () => {
  // input / output / count / error message
  const repeatTestCase = [
    ["", "", 0],
    ["", "", 1],
    ["", "", 1.1, "bytes: repeat count must be an integer"],
    ["", "", 2],
    ["", "", 0],
    ["-", "", 0],
    ["-", "-", -1, "bytes: negative repeat count"],
    ["-", "----------", 10],
    ["abc ", "abc abc abc ", 3],
  ];
  for (const [input, output, count, errMsg] of repeatTestCase) {
    if (errMsg) {
      assertThrows(
        () => {
          repeat(new TextEncoder().encode(input as string), count as number);
        },
        Error,
        errMsg as string,
      );
    } else {
      const newBytes = repeat(
        new TextEncoder().encode(input as string),
        count as number,
      );

      assertEquals(new TextDecoder().decode(newBytes), output);
    }
  }
});

Deno.test("[bytes] concat", () => {
  const encoder = new TextEncoder();
  const u1 = encoder.encode("Hello ");
  const u2 = encoder.encode("World");
  const joined = concat(u1, u2);
  assertEquals(new TextDecoder().decode(joined), "Hello World");
  assert(u1 !== joined);
  assert(u2 !== joined);
});

Deno.test("[bytes] concat empty arrays", () => {
  const u1 = new Uint8Array();
  const u2 = new Uint8Array();
  const joined = concat(u1, u2);
  assertEquals(joined.byteLength, 0);
  assert(u1 !== joined);
  assert(u2 !== joined);
});

Deno.test("[bytes] concat multiple arrays", () => {
  const encoder = new TextEncoder();
  const u1 = encoder.encode("Hello ");
  const u2 = encoder.encode("W");
  const u3 = encoder.encode("o");
  const u4 = encoder.encode("r");
  const u5 = encoder.encode("l");
  const u6 = encoder.encode("d");
  const joined = concat(u1, u2, u3, u4, u5, u6);
  assertEquals(new TextDecoder().decode(joined), "Hello World");
  assert(u1 !== joined);
  assert(u2 !== joined);
});

Deno.test("[bytes] includesNeedle", () => {
  const encoder = new TextEncoder();
  const source = encoder.encode("deno.land");
  const pattern = encoder.encode("deno");

  assert(includesNeedle(source, pattern));
  assert(includesNeedle(new Uint8Array([0, 1, 2, 3]), new Uint8Array([2, 3])));

  assert(includesNeedle(source, pattern, -10));
  assert(!includesNeedle(source, pattern, -1));
});

Deno.test("[bytes] copy", function () {
  const dst = new Uint8Array(4);

  dst.fill(0);
  let src = Uint8Array.of(1, 2);
  let len = copy(src, dst, 0);
  assert(len === 2);
  assertEquals(dst, Uint8Array.of(1, 2, 0, 0));

  dst.fill(0);
  src = Uint8Array.of(1, 2);
  len = copy(src, dst, 1);
  assert(len === 2);
  assertEquals(dst, Uint8Array.of(0, 1, 2, 0));

  dst.fill(0);
  src = Uint8Array.of(1, 2, 3, 4, 5);
  len = copy(src, dst);
  assert(len === 4);
  assertEquals(dst, Uint8Array.of(1, 2, 3, 4));

  dst.fill(0);
  src = Uint8Array.of(1, 2);
  len = copy(src, dst, 100);
  assert(len === 0);
  assertEquals(dst, Uint8Array.of(0, 0, 0, 0));

  dst.fill(0);
  src = Uint8Array.of(3, 4);
  len = copy(src, dst, -2);
  assert(len === 2);
  assertEquals(dst, Uint8Array.of(3, 4, 0, 0));
});
