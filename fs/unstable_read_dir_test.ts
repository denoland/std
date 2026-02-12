// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals, assertRejects, assertThrows } from "@std/assert";
import { fromFileUrl, join, resolve } from "@std/path";
import { readDir, readDirSync } from "./unstable_read_dir.ts";
import { NotFound } from "./unstable_errors.js";

const testdataDir = resolve(fromFileUrl(import.meta.url), "../testdata");

Deno.test("readDir() reads from the directory and its subdirectories", async () => {
  const files = [];
  for await (const e of readDir(testdataDir)) {
    files.push(e);
  }

  let counter = 0;
  for (const f of files) {
    if (f.name === "walk") {
      assert(f.isDirectory);
      counter++;
    }
  }

  assertEquals(counter, 1);
});

Deno.test("readDir() rejects when the path is not a directory", async () => {
  await assertRejects(async () => {
    const testFile = join(testdataDir, "0.ts");
    await readDir(testFile)[Symbol.asyncIterator]().next();
  }, Error);
});

Deno.test("readDir() rejects when the directory does not exist", async () => {
  await assertRejects(async () => {
    await readDir("non_existent_dir")[Symbol.asyncIterator]().next();
  }, NotFound);
});

Deno.test("readDirSync() reads from the directory and its subdirectories", () => {
  const files = [];
  for (const e of readDirSync(testdataDir)) {
    files.push(e);
  }

  let counter = 0;
  for (const f of files) {
    if (f.name === "walk") {
      assert(f.isDirectory);
      counter++;
    }
  }

  assertEquals(counter, 1);
});

Deno.test("readDirSync() throws with Error when the path is not a directory", () => {
  assertThrows(() => {
    const testFile = join(testdataDir, "0.ts");
    readDirSync(testFile)[Symbol.iterator]().next();
  }, Error);
});

Deno.test("readDirSync() throws with NotFound when a directory does not exist", () => {
  assertThrows(() => {
    readDirSync("non_existent_dir")[Symbol.iterator]().next();
  }, NotFound);
});
