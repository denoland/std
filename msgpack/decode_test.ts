// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { decode } from "./decode.ts";

Deno.test("positive fixint", () => {
  for (let i = 0; i <= 0x7f; i++) {
    assertEquals(decode(new Uint8Array([i])), i);
  }
});

Deno.test("fixmap", () => {
  const map = { "a": 2, "b": 3 };
  const encodedMap = [0b1010_0001, 97, 2, 0b1010_0001, 98, 3];

  assertEquals(decode(new Uint8Array([0b10000000 | 2, ...encodedMap])), map);
});

Deno.test("fixarray", () => {
  const array = [0, 1, 2, 3, 4, 5, 6];

  assertEquals(
    decode(new Uint8Array([0b10010000 | array.length, ...array])),
    array,
  );
});

Deno.test("fixstr", () => {
  const str = "hello world!";
  const encoded = new TextEncoder().encode(str);

  assertEquals(
    decode(new Uint8Array([0xA0 | encoded.length, ...encoded])),
    str,
  );
});

Deno.test("nil, (never used), false, true", () => {
  assertEquals(decode(new Uint8Array([0xc0])), null); // nil
  assertThrows(() => decode(new Uint8Array([0xc1]))); // (never used)
  assertEquals(decode(new Uint8Array([0xc2])), false); // false
  assertEquals(decode(new Uint8Array([0xc3])), true); // true
});

Deno.test("bin 8, bin 16, bin 32", () => {
  const arr = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
  assertEquals(decode(new Uint8Array([0xc4, arr.length, ...arr])), arr);
  assertEquals(decode(new Uint8Array([0xc5, 0, arr.length, ...arr])), arr);
  assertEquals(
    decode(new Uint8Array([0xc6, 0, 0, 0, arr.length, ...arr])),
    arr,
  );
});

Deno.test("ext 8, ext 16, ext 32", () => {
  assertThrows(() => decode(new Uint8Array([0xc7])));
  assertThrows(() => decode(new Uint8Array([0xc8])));
  assertThrows(() => decode(new Uint8Array([0xc9])));
});

Deno.test("float 32, float 64", () => {
  assertEquals(
    decode(new Uint8Array([0xca, 0x43, 0xd2, 0x58, 0x52])),
    420.69000244140625,
  );
  assertEquals(
    decode(
      new Uint8Array([0xcb, 0x40, 0x7A, 0x4B, 0x0A, 0x3D, 0x70, 0xA3, 0xD7]),
    ),
    420.689999999999997726263245568,
  );
});

Deno.test("uint8, uint16, uint32, uint64", () => {
  assertEquals(decode(new Uint8Array([0xcc, 0xff])), 255);
  assertEquals(decode(new Uint8Array([0xcd, 0xff, 0xff])), 65535);
  assertEquals(
    decode(new Uint8Array([0xce, 0xff, 0xff, 0xff, 0xff])),
    4294967295,
  );
  assertEquals(
    decode(
      new Uint8Array([0xcf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
    ),
    18446744073709551615n,
  );
});

Deno.test("int8, int16, int32, int64", () => {
  assertEquals(decode(new Uint8Array([0xd0, 0x80])), -128);
  assertEquals(decode(new Uint8Array([0xd1, 0x80, 0x00])), -32768);
  assertEquals(
    decode(new Uint8Array([0xd2, 0x80, 0x00, 0x00, 0x00])),
    -2147483648,
  );
  assertEquals(
    decode(
      new Uint8Array([0xd3, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    ),
    -9223372036854775808n,
  );
});

Deno.test("fixext 1, fixext 2, fixext 4, fixext 8, fixext 16", () => {
  assertThrows(() => decode(new Uint8Array([0xd4])));
  assertThrows(() => decode(new Uint8Array([0xd5])));
  assertThrows(() => decode(new Uint8Array([0xd6])));
  assertThrows(() => decode(new Uint8Array([0xd7])));
  assertThrows(() => decode(new Uint8Array([0xd8])));
});

Deno.test("str 8, str 16, str 32", () => {
  const str = "hello world!";
  const encoded = new TextEncoder().encode(str);

  assertEquals(decode(new Uint8Array([0xd9, encoded.length, ...encoded])), str);
  assertEquals(
    decode(new Uint8Array([0xda, 0, encoded.length, ...encoded])),
    str,
  );
  assertEquals(
    decode(new Uint8Array([0xdb, 0, 0, 0, encoded.length, ...encoded])),
    str,
  );
});

Deno.test("array 16, array 32", () => {
  const array = [0, 1, 2, 3, 4, 5, 6];

  assertEquals(
    decode(new Uint8Array([0xdc, 0, array.length, ...array])),
    array,
  );
  assertEquals(
    decode(new Uint8Array([0xdd, 0, 0, 0, array.length, ...array])),
    array,
  );
});

Deno.test("map 16, map 32", () => {
  const map = { "a": 2, "b": 3 };
  const encodedMap = [0b1010_0001, 97, 2, 0b1010_0001, 98, 3];

  assertEquals(decode(new Uint8Array([0xde, 0, 2, ...encodedMap])), map);
  assertEquals(decode(new Uint8Array([0xdf, 0, 0, 0, 2, ...encodedMap])), map);
});

Deno.test("negative fixint", () => {
  for (let i = -32; i <= -1; i++) {
    assertEquals(decode(new Uint8Array([i])), i);
  }
});
