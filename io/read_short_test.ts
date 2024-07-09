// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { readShort } from "./read_short.ts";
import { BufReader } from "./buf_reader.ts";
import { BinaryReader } from "./_test_common.ts";

Deno.test("testReadShort", async function () {
  const r = new BinaryReader(new Uint8Array([0x12, 0x34]));
  const short = await readShort(new BufReader(r));
  assertEquals(short, 0x1234);
});
