// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { readAll, readAllSync } from "./read_all.ts";
import { Buffer } from "./buffer.ts";
import { init } from "./_test_common.ts";

Deno.test("readAll()", async () => {
  const testBytes = init();
  assert(testBytes);
  const reader = new Buffer(testBytes.buffer);
  const actualBytes = await readAll(reader);
  assertEquals(testBytes, actualBytes);
});

Deno.test("readAllSync()", () => {
  const testBytes = init();
  assert(testBytes);
  const reader = new Buffer(testBytes.buffer);
  const actualBytes = readAllSync(reader);
  assertEquals(testBytes, actualBytes);
});
