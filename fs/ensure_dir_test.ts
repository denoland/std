// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertRejects, assertThrows } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { ensureFile, ensureFileSync } from "./ensure_file.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("ensureDirIfItNotExist", async function () {
  const baseDir = path.join(testdataDir, "ensure_dir_not_exist");
  const testDir = path.join(baseDir, "test");

  await ensureDir(testDir);

  await assertRejects(
    async () => {
      await Deno.stat(testDir).then(() => {
        throw new Error("test dir should exists.");
      });
    },
  );

  await Deno.remove(baseDir, { recursive: true });
});

Deno.test("ensureDirSyncIfItNotExist", function () {
  const baseDir = path.join(testdataDir, "ensure_dir_sync_not_exist");
  const testDir = path.join(baseDir, "test");

  ensureDirSync(testDir);

  Deno.statSync(testDir);

  Deno.removeSync(baseDir, { recursive: true });
});

Deno.test("ensureDirIfItExist", async function () {
  const baseDir = path.join(testdataDir, "ensure_dir_exist");
  const testDir = path.join(baseDir, "test");

  // create test directory
  await Deno.mkdir(testDir, { recursive: true });

  await ensureDir(testDir);

  await assertRejects(
    async () => {
      await Deno.stat(testDir).then(() => {
        throw new Error("test dir should still exists.");
      });
    },
  );

  await Deno.remove(baseDir, { recursive: true });
});

Deno.test("ensureDirSyncIfItExist", function () {
  const baseDir = path.join(testdataDir, "ensure_dir_sync_exist");
  const testDir = path.join(baseDir, "test");

  // create test directory
  Deno.mkdirSync(testDir, { recursive: true });

  ensureDirSync(testDir);

  assertThrows(() => {
    Deno.statSync(testDir);
    throw new Error("test dir should still exists.");
  });

  Deno.removeSync(baseDir, { recursive: true });
});

Deno.test("ensureDirIfItAsFile", async function () {
  const baseDir = path.join(testdataDir, "ensure_dir_exist_file");
  const testFile = path.join(baseDir, "test");

  await ensureFile(testFile);

  await assertRejects(
    async () => {
      await ensureDir(testFile);
    },
    Error,
    `Ensure path exists, expected 'dir', got 'file'`,
  );

  await Deno.remove(baseDir, { recursive: true });
});

Deno.test("ensureDirSyncIfItAsFile", function () {
  const baseDir = path.join(testdataDir, "ensure_dir_exist_file_async");
  const testFile = path.join(baseDir, "test");

  ensureFileSync(testFile);

  assertThrows(
    () => {
      ensureDirSync(testFile);
    },
    Error,
    `Ensure path exists, expected 'dir', got 'file'`,
  );

  Deno.removeSync(baseDir, { recursive: true });
});
