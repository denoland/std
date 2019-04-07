// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { remove, removeSync } from "./remove.ts";
import { exists, existsSync } from "./exists.ts";
import { ensureFile, ensureFileSync } from "./ensure_file.ts";
import * as path from "./path/mod.ts";

const testdataDir = path.resolve("fs", "testdata");

test(async function removeFile() {
  const testFile = path.join(testdataDir, "remove_test_file.json");

  await Deno.writeFile(testFile, new Uint8Array());

  assertEquals(await exists(testFile), true);

  await remove(testFile);

  assertEquals(await exists(testFile), false);
});

test(async function removeDirectory() {
  const testFolder = path.join(testdataDir, "remove_test_folder");
  const testFile = path.join(testFolder, "remove_test_file.json");

  await ensureFile(testFile);
  await Deno.writeFile(testFile, new Uint8Array());

  assertEquals(await exists(testFile), true);

  await remove(testFolder);

  assertEquals(await exists(testFile), false);
  assertEquals(await exists(testFolder), false);
});

test(function removeFileSync() {
  const testFile = path.join(testdataDir, "remove_test_file_sync.json");

  Deno.writeFileSync(testFile, new Uint8Array());

  assertEquals(existsSync(testFile), true);

  removeSync(testFile);

  assertEquals(existsSync(testFile), false);
});

test(function removeDirectorySync() {
  const testFolder = path.join(testdataDir, "remove_test_folder_sync");
  const testFile = path.join(testFolder, "remove_test_file.json");

  ensureFileSync(testFile);
  Deno.writeFileSync(testFile, new Uint8Array());

  assertEquals(existsSync(testFile), true);

  removeSync(testFolder);

  assertEquals(existsSync(testFile), false);
  assertEquals(existsSync(testFolder), false);
});
