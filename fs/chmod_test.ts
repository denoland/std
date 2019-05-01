// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import {
  assertEquals,
  assertThrows,
  assertThrowsAsync
} from "../testing/asserts.ts";
import { chmod, chmodSync } from "./chmod.ts";
import { exists, existsSync } from "./exists.ts";
import { ensureFile, ensureFileSync } from "./ensure_file.ts";
import * as path from "./path/mod.ts";

const testdataDir = path.resolve("fs", "testdata");

test(async function chmodFileNotExists(): Promise<void> {
  const filePath = path.join(testdataDir, "chmod_test_nonexistent");
  const fileMode = 0o777;

  await assertThrowsAsync(
    async (): Promise<void> => {
      await chmod(filePath, fileMode);
    },
    Error,
    "No such file or directory specified at path."
  )
})

test(function chmodSyncFileNotExists(): void {
  const filePath = path.join(testdataDir, "chmod_test_nonexistent");
  const fileMode = 0o777;

  assertThrows(
    (): void => {
      chmodSync(filePath, fileMode)
    },
    Error,
    "No such file or directory specified at path."
  )
})

test(async function chmodDirectory(): Promise<void> {
  const dirPath = path.join(testdataDir, "chmod_test_dir");
  const dirMode = 0o777;

  await Promise.all([
    Deno.mkdir(dirPath, true)
  ]);
  assertEquals(await exists(dirPath), true);

  await chmod(dirPath, dirMode);
  // TODO (maxwyb): verify file permission after implement access syscall in Deno

  await Deno.remove(dirPath, { recursive: true });
})

test(function chmodSyncDirectory(): void {
  const dirPath = path.join(testdataDir, "chmod_test_dir");
  const dirMode = 0o777;

  Deno.mkdirSync(dirPath, true)
  assertEquals(existsSync(dirPath), true);

  chmodSync(dirPath, dirMode);

  Deno.removeSync(dirPath, { recursive: true })
})

test(async function chmodFile(): Promise<void> {
  const filePath = path.join(testdataDir, "chmod_test_file.txt");
  const fileMode = 0o400;

  await Promise.all([ensureFile(filePath)]);
  await Promise.all([
    Deno.writeFile(filePath, new TextEncoder().encode("test_file_contents"))
  ])
  assertEquals(await exists(filePath), true);

  await chmod(filePath, fileMode);

  await Deno.remove(filePath);
})

test(function chmodSyncFile(): void {
  const filePath = path.join(testdataDir, "chmod_test_file.txt");
  const fileMode = 0o400;

  ensureFileSync(filePath);
  Deno.writeFileSync(filePath,  new TextEncoder().encode("test_file_contents"))
  assertEquals(existsSync(filePath), true);

  chmodSync(filePath, fileMode);

  Deno.removeSync(filePath);
})
