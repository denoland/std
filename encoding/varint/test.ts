// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { decodeU32, decodeU64, encodeU32, encodeU64 } from "./mod.ts";
import { assertEquals, assertThrows } from "../../testing/asserts.ts";

const U32MAX = 4_294_967_295;
const U64MAX = 18_446_744_073_709_551_615n;

Deno.test({
  name: "VarInt encode",
  fn: function () {
    assertEquals(encodeU32(0), new Uint8Array([0]));
    assertEquals(encodeU32(1), new Uint8Array([1]));
    assertEquals(encodeU32(127), new Uint8Array([127]));
    assertEquals(encodeU32(128), new Uint8Array([128, 1]));
    assertEquals(encodeU32(255), new Uint8Array([255, 1]));
    assertEquals(encodeU32(25565), new Uint8Array([221, 199, 1]));
    assertEquals(encodeU32(2097151), new Uint8Array([255, 255, 127]));
    assertEquals(
      encodeU32(2147483647),
      new Uint8Array([255, 255, 255, 255, 7]),
    );

    assertThrows(() => encodeU32(-1), RangeError, "Signed");
    assertThrows(() => encodeU32(U32MAX + 1), RangeError);
    assertThrows(() => encodeU32(1.1), TypeError);
  },
});

Deno.test({
  name: "VarInt decode",
  fn: function () {
    assertEquals(decodeU32(new Uint8Array([0])), 0);
    assertEquals(decodeU32(new Uint8Array([1])), 1);
    assertEquals(decodeU32(new Uint8Array([127])), 127);
    assertEquals(decodeU32(new Uint8Array([128, 1])), 128);
    assertEquals(decodeU32(new Uint8Array([255, 1])), 255);
    assertEquals(decodeU32(new Uint8Array([221, 199, 1])), 25565);
    assertEquals(
      decodeU32(new Uint8Array([255, 255, 127])),
      2097151,
    );
    assertEquals(
      decodeU32(new Uint8Array([255, 255, 255, 255, 7])),
      2147483647,
    );
    assertThrows(() => decodeU32(new Uint8Array(6)), RangeError, "Too");
    assertThrows(
      () => decodeU32(new Uint8Array([255, 255])),
      RangeError,
      "Bad",
    );
  },
});

Deno.test({
  name: "VarLong encode",
  fn: function () {
    assertEquals(encodeU64(0n), new Uint8Array([0]));
    assertEquals(encodeU64(1n), new Uint8Array([1]));
    assertEquals(encodeU64(2n), new Uint8Array([2]));
    assertEquals(encodeU64(127n), new Uint8Array([127]));
    assertEquals(encodeU64(128n), new Uint8Array([128, 1]));
    assertEquals(encodeU64(255n), new Uint8Array([255, 1]));
    assertEquals(
      encodeU64(2147483647n),
      new Uint8Array([255, 255, 255, 255, 7]),
    );
    assertEquals(
      encodeU64(9223372036854775807n),
      new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 127]),
    );
    assertThrows(() => encodeU64(-1n), RangeError, "Signed");
    assertThrows(() => encodeU64(U64MAX + 1n), RangeError);
  },
});

Deno.test({
  name: "VarLong decode",
  fn: function () {
    assertEquals(decodeU64(new Uint8Array([0])), 0n);
    assertEquals(decodeU64(new Uint8Array([1])), 1n);
    assertEquals(decodeU64(new Uint8Array([2])), 2n);
    assertEquals(decodeU64(new Uint8Array([127])), 127n);
    assertEquals(decodeU64(new Uint8Array([128, 1])), 128n);
    assertEquals(decodeU64(new Uint8Array([255, 1])), 255n);
    assertEquals(
      decodeU64(new Uint8Array([255, 255, 255, 255, 7])),
      2147483647n,
    );
    assertEquals(
      decodeU64(
        new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 127]),
      ),
      9223372036854775807n,
    );
    assertThrows(() => decodeU32(new Uint8Array(11)), RangeError, "Too");
    assertThrows(
      () => decodeU32(new Uint8Array([255, 255])),
      RangeError,
      "Bad",
    );
  },
});
