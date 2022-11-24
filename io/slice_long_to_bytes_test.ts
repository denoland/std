// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import { readLong, sliceLongToBytes } from "./util.ts";
import { BufReader } from "./buffer.ts";
import { StringReader } from "./readers.ts";
import { BinaryReader } from "./_test_util.ts";

Deno.test("testSliceLongToBytes", function () {
  const arr = sliceLongToBytes(0x1234567890abcdef);
  const actual = readLong(new BufReader(new BinaryReader(new Uint8Array(arr))));
  const expected = readLong(
    new BufReader(
      new BinaryReader(
        new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef]),
      ),
    ),
  );
  assertEquals(actual, expected);
});

Deno.test("testSliceLongToBytes2", function () {
  const arr = sliceLongToBytes(0x12345678);
  assertEquals(arr, [0, 0, 0, 0, 0x12, 0x34, 0x56, 0x78]);
});

Deno.test("testStringReaderEof", async function () {
  const r = new StringReader("abc");
  assertEquals(await r.read(new Uint8Array()), 0);
  assertEquals(await r.read(new Uint8Array(4)), 3);
  assertEquals(await r.read(new Uint8Array(1)), null);
});
