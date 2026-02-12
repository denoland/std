// Copyright 2018-2026 the Deno authors. MIT license.
import { assert, assertRejects, assertThrows } from "@std/assert";
import { utime, utimeSync } from "./unstable_utime.ts";
import { NotFound } from "./unstable_errors.js";

import { statSync } from "node:fs";

const now = new Date();
const filePath = "fs/testdata/copy_file.txt";

Deno.test("utime() change atime and mtime date", async () => {
  const fileBefore = statSync(filePath);

  await utime(filePath, now, now);

  const fileAfter = statSync(filePath);

  assert(fileBefore.atime != fileAfter.atime);
  assert(fileBefore.mtime != fileAfter.mtime);
});

Deno.test("utime() fail on NotFound file", async () => {
  const randomFile = "foo.txt";

  await assertRejects(async () => {
    await utime(randomFile, now, now);
  }, NotFound);
});

Deno.test("utimeSync() change atime and mtime data", () => {
  const fileBefore = statSync(filePath);

  utimeSync(filePath, now, now);

  const fileAfter = statSync(filePath);

  assert(fileBefore.atime != fileAfter.atime);
  assert(fileBefore.mtime != fileAfter.mtime);
});

Deno.test("utimeSync() fail on NotFound file", () => {
  const randomFile = "foo.txt";

  assertThrows(() => {
    utimeSync(randomFile, now, now);
  }, NotFound);
});
