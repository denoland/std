// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import {
  concat,
  contains,
  copy,
  endsWith,
  equals,
  indexOf,
  lastIndexOf,
  repeat,
  startsWith,
} from "./mod.ts";
import { assert, assertEquals, assertThrows } from "../testing/asserts.ts";

Deno.test("[bytes] indexOf1", () => {
  const i = indexOf(
    new Uint8Array([1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 3]),
    new Uint8Array([0, 1, 2]),
  );
  assertEquals(i, 2);
});

Deno.test("[bytes] indexOf2", () => {
  const i = indexOf(new Uint8Array([0, 0, 1]), new Uint8Array([0, 1]));
  assertEquals(i, 1);
});

Deno.test("[bytes] indexOf3", () => {
  const encoder = new TextEncoder();
  const i = indexOf(encoder.encode("Deno"), encoder.encode("D"));
  assertEquals(i, 0);
});

Deno.test("[bytes] indexOf4", () => {
  const i = indexOf(new Uint8Array(), new Uint8Array([0, 1]));
  assertEquals(i, -1);
});

Deno.test("[bytes] indexOf with start index", () => {
  const i = indexOf(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    1,
  );
  assertEquals(i, 3);
});

Deno.test("[bytes] indexOf with start index 2", () => {
  const i = indexOf(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    7,
  );
  assertEquals(i, -1);
});

Deno.test("[bytes] lastIndexOf1", () => {
  const i = lastIndexOf(
    new Uint8Array([0, 1, 2, 0, 1, 2, 0, 1, 3]),
    new Uint8Array([0, 1, 2]),
  );
  assertEquals(i, 3);
});

Deno.test("[bytes] lastIndexOf2", () => {
  const i = lastIndexOf(new Uint8Array([0, 1, 1]), new Uint8Array([0, 1]));
  assertEquals(i, 0);
});

Deno.test("[bytes] lastIndexOf3", () => {
  const i = lastIndexOf(new Uint8Array(), new Uint8Array([0, 1]));
  assertEquals(i, -1);
});

Deno.test("[bytes] lastIndexOf with start index", () => {
  const i = lastIndexOf(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    2,
  );
  assertEquals(i, 0);
});

Deno.test("[bytes] lastIndexOf with start index 2", () => {
  const i = lastIndexOf(
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

Deno.test("[bytes] startsWith", () => {
  const v = startsWith(new Uint8Array([0, 1, 2]), new Uint8Array([0, 1]));
  const v2 = startsWith(new Uint8Array([0, 1, 2]), new Uint8Array([0, 2]));
  const v3 = startsWith(new Uint8Array([0, 1, 2]), new Uint8Array([0, 2, 3 ,4]));
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
        (): void => {
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

Deno.test("[bytes] contains", () => {
  const encoder = new TextEncoder();
  const source = encoder.encode("deno.land");
  const pattern = encoder.encode("deno");
  assert(contains(source, pattern));

  assert(contains(new Uint8Array([0, 1, 2, 3]), new Uint8Array([2, 3])));
});

Deno.test("[bytes] copy", function (): void {
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
