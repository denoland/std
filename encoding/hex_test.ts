// Ported from Go
// https://github.com/golang/go/blob/go1.12.5/src/encoding/hex/hex.go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../assert/mod.ts";

import { decodeHex, encodeHex } from "./hex.ts";

const testCases = [
  // encoded(hex) / decoded(Uint8Array)
  ["", []],
  ["0001020304050607", [0, 1, 2, 3, 4, 5, 6, 7]],
  ["08090a0b0c0d0e0f", [8, 9, 10, 11, 12, 13, 14, 15]],
  ["f0f1f2f3f4f5f6f7", [0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7]],
  ["f8f9fafbfcfdfeff", [0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff]],
  ["67", Array.from(new TextEncoder().encode("g"))],
  ["e3a1", [0xe3, 0xa1]],
];

const errCases: [string, ErrorConstructor, string][] = [
  // encoded(hex) / error / msg
  ["0", RangeError, ""],
  ["zd4aa", TypeError, "'z'"],
  ["d4aaz", TypeError, "'z'"],
  ["30313", RangeError, ""],
  ["0g", TypeError, "'g'"],
  ["00gg", TypeError, "'g'"],
  ["0\x01", TypeError, "'\x01'"],
  ["ffeed", RangeError, ""],
];

Deno.test("encodeHex() handles string", () => {
  {
    const srcStr = "abc";
    const dest = encodeHex(srcStr);
    assertEquals(dest, "616263");
  }

  for (const [enc, dec] of testCases) {
    const src = new Uint8Array(dec as number[]);
    const dest = encodeHex(src);
    assertEquals(dest.length, src.length * 2);
    assertEquals(dest, enc);
  }
});

Deno.test("decodeHex() handles hex", () => {
  // Case for decoding uppercase hex characters, since
  // Encode always uses lowercase.
  const extraTestcase: [string, number[]][] = [
    ["F8F9FAFBFCFDFEFF", [0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff]],
  ];

  const cases = testCases.concat(extraTestcase);

  for (const [enc, dec] of cases) {
    const dest = decodeHex(enc as string);
    assertEquals(dest, new Uint8Array(dec as number[]));
  }
});

Deno.test("decodeHex() throws on invalid input", () => {
  for (const [input, expectedErr, msg] of errCases) {
    assertThrows(
      () => decodeHex(input),
      expectedErr,
      msg,
    );
  }
});
