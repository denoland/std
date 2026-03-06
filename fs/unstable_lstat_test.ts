// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertRejects, assertThrows } from "@std/assert";
import { lstat, lstatSync } from "./unstable_lstat.ts";
import { NotFound } from "./unstable_errors.js";

Deno.test("lstat() and lstatSync() return FileInfo for a file", async () => {
  {
    const fileInfo = await lstat("README.md");
    assert(fileInfo.isFile);
  }
  {
    const fileInfo = lstatSync("README.md");
    assert(fileInfo.isFile);
  }
});

Deno.test("lstat() and lstatSync() do not follow symlinks", async () => {
  const linkFile = new URL("testdata/0-link", import.meta.url);
  {
    const fileInfo = await lstat(linkFile);
    assert(fileInfo.isSymlink);
  }
  {
    const fileInfo = lstatSync(linkFile);
    assert(fileInfo.isSymlink);
  }
});

Deno.test("lstat() and lstatSync() return FileInfo for a directory", async () => {
  {
    const fileInfo = await lstat("fs");
    assert(fileInfo.isDirectory);
  }
  {
    const fileInfo = lstatSync("fs");
    assert(fileInfo.isDirectory);
  }
});

Deno.test("lstat() and lstatSync() throw with NotFound for a non-existent file", async () => {
  await assertRejects(async () => {
    await lstat("non_existent_file");
  }, NotFound);
  assertThrows(() => {
    lstatSync("non_existent_file");
  }, NotFound);
});
