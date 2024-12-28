// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assert, assertRejects } from "@std/assert";
import { lstat } from "./unstable_lstat.ts";
import { NotFound } from "./unstable_errors.js";

Deno.test("lstat() returns FileInfo for a file", async () => {
  const fileInfo = await lstat("README.md");

  assert(fileInfo.isFile);
});

Deno.test("lstat() does not follow symlinks", async () => {
  const linkFile = `${import.meta.dirname}/testdata/0-link`;
  const fileInfo = await lstat(linkFile);

  assert(fileInfo.isSymlink);
});

Deno.test("lstat() returns FileInfo for a directory", async () => {
  const fileInfo = await lstat("fs");

  assert(fileInfo.isDirectory);
});

Deno.test("lstat() rejects with NotFound for a non-existent file", async () => {
  await assertRejects(async () => {
    await lstat("non_existent_file");
  }, NotFound);
});
