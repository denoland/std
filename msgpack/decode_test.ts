// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { decode } from "./decode.ts";

Deno.test("decode() handles positive fixint", () => {
  for (let i = 0; i <= 0x7f; i++) {
    assertEquals(decode(Uint8Array.of(i)), i);
  }
});

Deno.test("decode() handles fixmap", () => {
  const map = { "a": 2, "b": 3 };
  const encodedMap = [0b1010_0001, 97, 2, 0b1010_0001, 98, 3];

  assertEquals(decode(Uint8Array.of(0b10000000 | 2, ...encodedMap)), map);
});

Deno.test("decode() handles fixarray", () => {
  const array = [0, 1, 2, 3, 4, 5, 6];

  assertEquals(
    decode(Uint8Array.of(0b10010000 | array.length, ...array)),
    array,
  );
});

Deno.test("decode() handles fixstr", () => {
  const str = "hello world!";
  const encoded = new TextEncoder().encode(str);

  assertEquals(
    decode(Uint8Array.of(0xA0 | encoded.length, ...encoded)),
    str,
  );
});

Deno.test("decode() handles nil, (never used), false, true", () => {
  assertEquals(decode(Uint8Array.of(0xc0)), null); // nil
  assertThrows(() => decode(Uint8Array.of(0xc1))); // (never used)
  assertEquals(decode(Uint8Array.of(0xc2)), false); // false
  assertEquals(decode(Uint8Array.of(0xc3)), true); // true
});

Deno.test("decode() handles bin 8, bin 16, bin 32", () => {
  const arr = Uint8Array.of(0, 1, 2, 3, 4, 5, 6, 7);
  assertEquals(decode(Uint8Array.of(0xc4, arr.length, ...arr)), arr);
  assertEquals(decode(Uint8Array.of(0xc5, 0, arr.length, ...arr)), arr);
  assertEquals(
    decode(Uint8Array.of(0xc6, 0, 0, 0, arr.length, ...arr)),
    arr,
  );
});

Deno.test("decode() handles ext 8, ext 16, ext 32", () => {
  assertThrows(() => decode(Uint8Array.of(0xc7)));
  assertThrows(() => decode(Uint8Array.of(0xc8)));
  assertThrows(() => decode(Uint8Array.of(0xc9)));
});

Deno.test("decode() handles float 32, float 64", () => {
  assertEquals(
    decode(Uint8Array.of(0xca, 0x43, 0xd2, 0x58, 0x52)),
    420.69000244140625,
  );
  assertEquals(
    decode(
      Uint8Array.of(0xcb, 0x40, 0x09, 0x21, 0xFB, 0x54, 0x44, 0x2D, 0x18),
    ),
    3.14159265358979311599796346854,
  );
});

Deno.test("decode() handles uint8, uint16, uint32, uint64", () => {
  assertEquals(decode(Uint8Array.of(0xcc, 0xff)), 255);
  assertEquals(decode(Uint8Array.of(0xcd, 0xff, 0xff)), 65535);
  assertEquals(
    decode(Uint8Array.of(0xce, 0xff, 0xff, 0xff, 0xff)),
    4294967295,
  );
  assertEquals(
    decode(
      Uint8Array.of(0xcf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff),
    ),
    18446744073709551615n,
  );
});

Deno.test("decode() handles int8, int16, int32, int64", () => {
  assertEquals(decode(Uint8Array.of(0xd0, 0x80)), -128);
  assertEquals(decode(Uint8Array.of(0xd1, 0x80, 0x00)), -32768);
  assertEquals(
    decode(Uint8Array.of(0xd2, 0x80, 0x00, 0x00, 0x00)),
    -2147483648,
  );
  assertEquals(
    decode(
      Uint8Array.of(0xd3, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00),
    ),
    -9223372036854775808n,
  );
});

Deno.test("decode() handles fixext 1, fixext 2, fixext 4, fixext 8, fixext 16", () => {
  assertThrows(() => decode(Uint8Array.of(0xd4)));
  assertThrows(() => decode(Uint8Array.of(0xd5)));
  assertThrows(() => decode(Uint8Array.of(0xd6)));
  assertThrows(() => decode(Uint8Array.of(0xd7)));
  assertThrows(() => decode(Uint8Array.of(0xd8)));
});

Deno.test("decode() handles str 8, str 16, str 32", () => {
  const str = "hello world!";
  const encoded = new TextEncoder().encode(str);

  assertEquals(decode(Uint8Array.of(0xd9, encoded.length, ...encoded)), str);
  assertEquals(
    decode(Uint8Array.of(0xda, 0, encoded.length, ...encoded)),
    str,
  );
  assertEquals(
    decode(Uint8Array.of(0xdb, 0, 0, 0, encoded.length, ...encoded)),
    str,
  );
});

Deno.test("decode() handles array 16, array 32", () => {
  const array = [0, 1, 2, 3, 4, 5, 6];

  assertEquals(
    decode(Uint8Array.of(0xdc, 0, array.length, ...array)),
    array,
  );
  assertEquals(
    decode(Uint8Array.of(0xdd, 0, 0, 0, array.length, ...array)),
    array,
  );
});

Deno.test("decode() handles map 16, map 32", () => {
  const map = { "a": 2, "b": 3 };
  const encodedMap = [0b1010_0001, 97, 2, 0b1010_0001, 98, 3];

  assertEquals(decode(Uint8Array.of(0xde, 0, 2, ...encodedMap)), map);
  assertEquals(decode(Uint8Array.of(0xdf, 0, 0, 0, 2, ...encodedMap)), map);
});

Deno.test("decode() handles negative fixint", () => {
  for (let i = -32; i <= -1; i++) {
    assertEquals(decode(Uint8Array.of(i)), i);
  }
});

const EARLY_EOF_CASES: Record<string, number[]> = {
  "empty input is invalid": [],
  "fixmap with one entry, no data": [0b1000_0001],
  "fixarray with one entry, no data": [0b1001_0001],
  "fixstr with length 1, no data": [0b1011_0001],
  "bin 8 with no length": [0xc4],
  "bin 8 with length 1, no data": [0xc4, 1],
  "bin 16 with no length": [0xc5],
  "bin 16 with too short length": [0xc5, 0],
  "bin 16 with length 1, no data": [0xc5, 0, 1],
  "bin 32 with no length": [0xc6],
  "bin 32 with too short length": [0xc6, 0, 0],
  "bin 32 with length 1, no data": [0xc6, 0, 0, 0, 1],
  "float 32 with no data": [0xca],
  "float 32 with too short data": [0xca, 0x43, 0xd2, 0x58],
  "float 64 with no data": [0xcb],
  "float 64 with too short data": [0xcb, 0x40, 0x09, 0x21, 0xFB, 0x54],
  "uint 8 with no data": [0xcc],
  "uint 16 with no data": [0xcd],
  "uint 16 with too short data": [0xcd, 0],
  "uint 32 with no data": [0xce],
  "uint 32 with too short data": [0xce, 0, 0],
  "uint 64 with no data": [0xcf],
  "uint 64 with too short data": [0xcf, 0, 0, 0, 0, 0],
  "int 8 with no data": [0xd0],
  "int 16 with no data": [0xd1],
  "int 16 with too short data": [0xd1, 0],
  "int 32 with no data": [0xd2],
  "int 32 with too short data": [0xd2, 0, 0],
  "int 64 with no data": [0xd3],
  "int 64 with too short data": [0xd3, 0, 0, 0, 0, 0],
  "str 8 with no length": [0xd9],
  "str 8 with length 1, no data": [0xd9, 1],
  "str 16 with no length": [0xda],
  "str 16 with too short length": [0xda, 0],
  "str 16 with length 1, no data": [0xda, 0, 1],
  "str 32 with no length": [0xdb],
  "str 32 with too short length": [0xdb, 0, 0, 0],
  "str 32 with length 1, no data": [0xdb, 0, 0, 0, 1],
  "array 16 with no length": [0xdc],
  "array 16 with too short length": [0xdc, 0],
  "array 16 with length 1, no data": [0xdc, 0, 1],
  "array 32 with no length": [0xdd],
  "array 32 with too short length": [0xdd, 0, 0, 0],
  "array 32 with length 1, no data": [0xdd, 0, 0, 0, 1],
  "map 16 with no length": [0xde],
  "map 16 with too short length": [0xde, 0],
  "map 16 with length 1, no data": [0xde, 0, 1],
  "map 32 with no length": [0xdf],
  "map 32 with too short length": [0xdf, 0, 0, 0],
  "map 32 with length 1, no data": [0xdf, 0, 0, 0, 1],
};

Deno.test("decode() handles early end of data", async (t) => {
  for (const name in EARLY_EOF_CASES) {
    await t.step(name, () => {
      assertThrows(() => decode(new Uint8Array(EARLY_EOF_CASES[name]!)));
    });
  }
});

Deno.test("decode() throws when there's extra data after the end", () => {
  assertThrows(
    () => decode(Uint8Array.of(1, 0)), // extra 0 after 1
    EvalError,
    "Messagepack decode did not consume whole array",
  );
  assertThrows(
    () => decode(Uint8Array.of(0xc3, 0)), // extra 0 after true
    EvalError,
    "Messagepack decode did not consume whole array",
  );
});

Deno.test("decode() throws when the key of the map is of invalid type", () => {
  // Decode something like map { true -> true }
  // but true is not a valid key
  assertThrows(
    () => decode(Uint8Array.of(0b10000000 | 1, 0xc2, 0xc2)),
    EvalError,
    "Cannot decode a key of a map: The type of key is invalid, keys must be a number or a string",
  );
});
