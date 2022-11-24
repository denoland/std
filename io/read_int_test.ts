// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { BinaryReader } from "./_test_util.ts";
import { readInt } from "./read_int.ts";
import { BufReader } from "./buffer.ts";
import { assertEquals } from "../testing/asserts.ts";

Deno.test("testReadInt", async function () {
  const r = new BinaryReader(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
  const int = await readInt(new BufReader(r));
  assertEquals(int, 0x12345678);
});
