// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertRejects, assertThrows } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { ensureFile, ensureFileSync } from "./ensure_file.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("ensureFileIfItNotExist", async function () {
  const testDir = path.join(testdataDir, "ensure_file_1");
  const testFile = path.join(testDir, "test.txt");

  await ensureFile(testFile);

  await assertRejects(
    async () => {
      await Deno.stat(testFile).then(() => {
        throw new Error("test file should exists.");
      });
    },
  );

  await Deno.remove(testDir, { recursive: true });
});

Deno.test("ensureFileSyncIfItNotExist", function () {
  const testDir = path.join(testdataDir, "ensure_file_2");
  const testFile = path.join(testDir, "test.txt");

  ensureFileSync(testFile);

  assertThrows(() => {
    Deno.statSync(testFile);
    throw new Error("test file should exists.");
  });

  Deno.removeSync(testDir, { recursive: true });
});

Deno.test("ensureFileIfItExist", async function () {
  const testDir = path.join(testdataDir, "ensure_file_3");
  const testFile = path.join(testDir, "test.txt");

  await Deno.mkdir(testDir, { recursive: true });
  await Deno.writeFile(testFile, new Uint8Array());

  await ensureFile(testFile);

  await assertRejects(
    async () => {
      await Deno.stat(testFile).then(() => {
        throw new Error("test file should exists.");
      });
    },
  );

  await Deno.remove(testDir, { recursive: true });
});

Deno.test("ensureFileSyncIfItExist", function () {
  const testDir = path.join(testdataDir, "ensure_file_4");
  const testFile = path.join(testDir, "test.txt");

  Deno.mkdirSync(testDir, { recursive: true });
  Deno.writeFileSync(testFile, new Uint8Array());

  ensureFileSync(testFile);

  assertThrows(() => {
    Deno.statSync(testFile);
    throw new Error("test file should exists.");
  });

  Deno.removeSync(testDir, { recursive: true });
});

Deno.test("ensureFileIfItExistAsDir", async function () {
  const testDir = path.join(testdataDir, "ensure_file_5");

  await Deno.mkdir(testDir, { recursive: true });

  await assertRejects(
    async () => {
      await ensureFile(testDir);
    },
    Error,
    `Ensure path exists, expected 'file', got 'dir'`,
  );

  await Deno.remove(testDir, { recursive: true });
});

Deno.test("ensureFileSyncIfItExistAsDir", function () {
  const testDir = path.join(testdataDir, "ensure_file_6");

  Deno.mkdirSync(testDir, { recursive: true });

  assertThrows(
    () => {
      ensureFileSync(testDir);
    },
    Error,
    `Ensure path exists, expected 'file', got 'dir'`,
  );

  Deno.removeSync(testDir, { recursive: true });
});
