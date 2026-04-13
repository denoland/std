// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertRejects, assertThrows } from "@std/assert";
import { stat, statSync } from "./unstable_stat.ts";
import { NotFound } from "./unstable_errors.js";

Deno.test("stat() and statSync() return FileInfo for a file", async () => {
  {
    const fileInfo = await stat("README.md");
    assert(fileInfo.isFile);
  }

  {
    const fileInfo = statSync("README.md");
    assert(fileInfo.isFile);
  }
});

Deno.test("stat() and statSync() return FileInfo for a directory", async () => {
  {
    const fileInfo = await stat("fs");
    assert(fileInfo.isDirectory);
  }
  {
    const fileInfo = statSync("fs");
    assert(fileInfo.isDirectory);
  }
});

Deno.test("stat() and statSync() throw with NotFound for a non-existent file", async () => {
  await assertRejects(async () => {
    await stat("non_existent_file");
  }, NotFound);
  assertThrows(() => {
    statSync("non_existent_file");
  }, NotFound);
});
