// Copyright 2018-2026 the Deno authors. MIT license.
// Copyright 2020 Keith Cirkel. All rights reserved. MIT license.
// This implementation is a port of https://deno.land/x/varint@v2.0.0 by @keithamus

import { assertEquals, assertThrows } from "@std/assert";
import {
  decodeVarint,
  decodeVarint32,
  encodeVarint,
  MaxUint64,
  MaxVarintLen64,
} from "./varint.ts";

function encodeDecode(i: number | bigint) {
  const [buf, n] = encodeVarint(i, new Uint8Array(MaxVarintLen64));
  const fn = (typeof i === "bigint") ? decodeVarint : decodeVarint32;
  const [j, m] = fn(buf);
  assertEquals(i, j, `${fn.name}(encodeVarint(${i})): ${i} !== ${j}`);
  assertEquals(
    n,
    m,
    `${fn.name}(encodeVarint(${i})): buffer lengths ${n} !== ${m}`,
  );
}

Deno.test("decodeVarint() handles empty buff", () => {
  assertThrows(() => decodeVarint(Uint8Array.of()), RangeError);
});

Deno.test("decodeVarint() handles manual", () => {
  assertEquals(decodeVarint(Uint8Array.of(172, 2)), [300n, 2]);
});
Deno.test("decodeVarint() handles max size", () => {
  assertEquals(
    decodeVarint(Uint8Array.of(255, 255, 255, 255, 255, 255, 255, 255, 255, 1)),
    [18446744073709551615n, 10],
  );
});
Deno.test("decodeVarint() throws on overflow", () => {
  assertThrows(
    () =>
      decodeVarint(
        Uint8Array.of(255, 255, 255, 255, 255, 255, 255, 255, 255, 2),
      ),
    RangeError,
  );
});
Deno.test("decodeVarint() handles with offset", () => {
  assertEquals(
    decodeVarint(
      Uint8Array.of(
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        255,
        1,
      ),
      4,
    ),
    [18446744073709551615n, 14],
  );
});
Deno.test("decodeVarint32() handles manual", () => {
  assertEquals(decodeVarint32(Uint8Array.of(172, 2)), [300, 2]);
});
Deno.test("decodeVarint32() handles max size", () => {
  assertEquals(
    decodeVarint32(Uint8Array.of(255, 255, 255, 255, 15, 0, 0, 0, 0, 0)),
    [4294967295, 5],
  );
});
Deno.test("decodeVarint32() throws on overflow", () => {
  assertThrows(
    () =>
      decodeVarint32(
        Uint8Array.of(255, 255, 255, 255, 255, 255, 255, 255, 15, 0),
      ),
    RangeError,
  );
});
Deno.test("decodeVarint32() handles with offset", () => {
  assertEquals(
    decodeVarint32(
      Uint8Array.of(255, 255, 255, 255, 255, 255, 255, 255, 15, 0),
      4,
    ),
    [4294967295, 9],
  );
});
Deno.test("encodeVarint() handles manual", () => {
  assertEquals(encodeVarint(300, new Uint8Array(2)), [
    Uint8Array.of(172, 2),
    2,
  ]);
  assertEquals(
    encodeVarint(4294967295),
    [Uint8Array.of(255, 255, 255, 255, 15), 5],
  );
  assertEquals(
    encodeVarint(18446744073709551615n),
    [Uint8Array.of(255, 255, 255, 255, 255, 255, 255, 255, 255, 1), 10],
  );
});
Deno.test("encodeVarint() throws on overflow uint64", () => {
  assertThrows(() => encodeVarint(1e+30), RangeError, "overflows uint64");
});
Deno.test("encodeVarint() throws on overflow with negative", () => {
  assertThrows(
    () => encodeVarint(-1),
    RangeError,
    "Cannot encode the input into varint as it should be non-negative integer: received -1",
  );
});
Deno.test(
  "encodeVarint() throws when the default buffer is too small (#7147)",
  () => {
    // 0x1234567891234567891n is 76 bits → cannot fit in 10-byte uint64
    // varint and must throw. Previously the OOB write at the 11th byte was
    // silently dropped and the function returned `[Uint8Array(10), 11]`.
    assertThrows(
      () => encodeVarint(0x1234567891234567891n),
      RangeError,
      "overflows uint64",
    );
  },
);

Deno.test(
  "encodeVarint() throws when a caller-provided buffer is too small",
  () => {
    // 200000 needs 3 varint bytes, buffer only has 2 → must throw rather
    // than silently truncate to 2 bytes.
    assertThrows(
      () => encodeVarint(200_000, new Uint8Array(2)),
      RangeError,
      "buffer holds at most 2 byte(s) after offset",
    );
  },
);

Deno.test(
  "encodeVarint() throws when offset leaves no room in the buffer",
  () => {
    // 10-byte buf but offset=10 → 0 bytes available; any positive value
    // overflows the slice and must throw.
    assertThrows(
      () => encodeVarint(42n, new Uint8Array(10), 10),
      RangeError,
      "buffer holds at most 0 byte(s) after offset",
    );
  },
);

Deno.test("encodeVarint() encodes with offset", () => {
  let uint = new Uint8Array(3);
  assertEquals(
    encodeVarint(300, uint, 1),
    [Uint8Array.of(172, 2), 3],
  );
  assertEquals(uint, Uint8Array.of(0, 172, 2));
  uint = new Uint8Array(MaxVarintLen64);
  uint[0] = uint[1] = uint[2] = 12;
  assertEquals(
    encodeVarint(4294967295, uint, 3),
    [Uint8Array.of(255, 255, 255, 255, 15), 8],
  );
  assertEquals(uint, Uint8Array.of(12, 12, 12, 255, 255, 255, 255, 15, 0, 0));
});
Deno.test("encodeDecode() handles BigInt", () => {
  for (
    const i of [
      0n,
      1n,
      2n,
      10n,
      20n,
      63n,
      64n,
      65n,
      127n,
      128n,
      129n,
      255n,
      256n,
      257n,
      300n,
      18446744073709551615n,
    ]
  ) {
    encodeDecode(i);
  }
  for (let i = 0x7n; i < MaxUint64; i <<= 1n) {
    encodeDecode(i);
  }
});
Deno.test("encodeDecode() handles decodeVarint32", () => {
  for (
    const i of [
      0,
      1,
      2,
      10,
      20,
      63,
      64,
      65,
      127,
      128,
      129,
      255,
      256,
      257,
      300,
      4294967295,
    ]
  ) {
    encodeDecode(i);
  }
  for (let i = 0x7; i > 0; i <<= 1) {
    encodeDecode(i);
  }
});
