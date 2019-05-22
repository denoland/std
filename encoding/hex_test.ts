// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runIfMain } from "../testing/mod.ts";
import { assertEquals, assertThrows } from "../testing/asserts.ts";

import {
  encodedLen,
  encode,
  encodeToString,
  decodedLen,
  decode,
  decodeString
} from "./hex.ts";

const testCases = [
  // encoded(hex) / decoded(Uint8Array)
  ["", []],
  ["0001020304050607", [0, 1, 2, 3, 4, 5, 6, 7]],
  ["08090a0b0c0d0e0f", [8, 9, 10, 11, 12, 13, 14, 15]],
  ["f0f1f2f3f4f5f6f7", [0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7]],
  ["f8f9fafbfcfdfeff", [0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff]],
  ["67", Array.from(new TextEncoder().encode("g"))],
  ["e3a1", [0xe3, 0xa1]]
];

test({
  name: "[encoding.hex] encodedLen",
  fn(): void {
    assertEquals(encodedLen(0), 0);
    assertEquals(encodedLen(1), 2);
    assertEquals(encodedLen(2), 4);
    assertEquals(encodedLen(3), 6);
    assertEquals(encodedLen(4), 8);
  }
});

test({
  name: "[encoding.hex] encode",
  fn(): void {
    {
      const srcStr = "abc";
      const src = new TextEncoder().encode(srcStr);
      const dest = new Uint8Array(encodedLen(src.length));
      const int = encode(dest, src);
      assertEquals(src, new Uint8Array([97, 98, 99]));
      assertEquals(int, 6);
    }

    {
      const srcStr = "abc";
      const src = new TextEncoder().encode(srcStr);
      const dest = new Uint8Array(2); // out of index
      assertThrows(
        () => {
          encode(dest, src);
        },
        Error,
        "Out of index."
      );
    }

    for (const [enc, dec] of testCases) {
      const dest = new Uint8Array(encodedLen(dec.length));
      const src = new Uint8Array(dec as number[]);
      const n = encode(dest, src);
      assertEquals(dest.length, n);
      assertEquals(new TextDecoder().decode(dest), enc);
    }
  }
});

test({
  name: "[encoding.hex] encodeToString",
  fn(): void {
    for (const [enc, dec] of testCases) {
      assertEquals(encodeToString(new Uint8Array(dec as number[])), enc);
    }
  }
});

test({
  name: "[encoding.hex] decodedLen",
  fn(): void {
    assertEquals(decodedLen(0), 0);
    assertEquals(decodedLen(2), 1);
    assertEquals(decodedLen(4), 2);
    assertEquals(decodedLen(6), 3);
    assertEquals(decodedLen(8), 4);
  }
});

test({
  name: "[encoding.hex] decode",
  fn(): void {
    const extraTestcase = [
      ["F8F9FAFBFCFDFEFF", [0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff]]
    ];

    const cases = testCases.concat(extraTestcase);

    for (const [enc, dec] of cases) {
      const dest = new Uint8Array(decodedLen(enc.length));
      const src = new TextEncoder().encode(enc as string);
      const [, err] = decode(dest, src);
      assertEquals(err, undefined);
      assertEquals(Array.from(dest), Array.from(dec as number[]));
    }
  }
});

test({
  name: "[encoding.hex] decodeString",
  fn(): void {
    for (const [enc, dec] of testCases) {
      const dst = decodeString(enc as string);

      assertEquals(dec, Array.from(dst));
    }
  }
});

runIfMain(import.meta);
