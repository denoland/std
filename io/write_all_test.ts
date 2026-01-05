// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { writeAll, writeAllSync } from "./write_all.ts";
import { Buffer } from "./buffer.ts";
import { init } from "./_test_common.ts";

Deno.test("writeAll()", async () => {
  const testBytes = init();
  assert(testBytes);
  const writer = new Buffer();
  await writeAll(writer, testBytes);
  const actualBytes = writer.bytes();
  assertEquals(testBytes, actualBytes);
});

Deno.test("writeAllSync()", () => {
  const testBytes = init();
  assert(testBytes);
  const writer = new Buffer();
  writeAllSync(writer, testBytes);
  const actualBytes = writer.bytes();
  assertEquals(testBytes, actualBytes);
});
