// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { BinaryReader } from "./_test_util.ts";
import { readShort } from "./read_short.ts";
import { BufReader } from "./buffer.ts";
import { assertEquals } from "../testing/asserts.ts";

Deno.test("testReadShort", async function () {
  const r = new BinaryReader(new Uint8Array([0x12, 0x34]));
  const short = await readShort(new BufReader(r));
  assertEquals(short, 0x1234);
});
