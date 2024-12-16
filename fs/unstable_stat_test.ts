// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assert, assertRejects } from "@std/assert";
import { stat } from "./unstable_stat.ts";
import { NotFound } from "./unstable_errors.js";

Deno.test("stat() returns FileInfo for a file", async () => {
  const fileInfo = await stat("README.md");

  assert(fileInfo.isFile);
});

Deno.test("stat() returns FileInfo for a directory", async () => {
  const fileInfo = await stat("fs");

  assert(fileInfo.isDirectory);
});

Deno.test("stat() rejects with NotFound for a non-existent file", async () => {
  await assertRejects(async () => {
    await stat("non_existent_file");
  }, NotFound);
});
