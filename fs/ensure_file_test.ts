// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertRejects, assertThrows } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { ensureFile, ensureFileSync } from "./ensure_file.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("ensureFileIfItNotExist", async function () {
  const testDir = path.join(testdataDir, "ensure_file_1");
  const testFile = path.join(testDir, "test.txt");

  try {
    await ensureFile(testFile);

    // test file should exists.
    await Deno.stat(testFile);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("ensureFileSyncIfItNotExist", function () {
  const testDir = path.join(testdataDir, "ensure_file_2");
  const testFile = path.join(testDir, "test.txt");

  try {
    ensureFileSync(testFile);

    // test file should exists.
    Deno.statSync(testFile);
  } finally {
    Deno.removeSync(testDir, { recursive: true });
  }
});

Deno.test("ensureFileIfItExist", async function () {
  const testDir = path.join(testdataDir, "ensure_file_3");
  const testFile = path.join(testDir, "test.txt");

  try {
    await Deno.mkdir(testDir, { recursive: true });
    await Deno.writeFile(testFile, new Uint8Array());

    await ensureFile(testFile);

    // test file should exists.
    await Deno.stat(testFile);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("ensureFileSyncIfItExist", function () {
  const testDir = path.join(testdataDir, "ensure_file_4");
  const testFile = path.join(testDir, "test.txt");

  try {
    Deno.mkdirSync(testDir, { recursive: true });
    Deno.writeFileSync(testFile, new Uint8Array());

    ensureFileSync(testFile);

    // test file should exists.
    Deno.statSync(testFile);
  } finally {
    Deno.removeSync(testDir, { recursive: true });
  }
});

Deno.test("ensureFileIfItExistAsDir", async function () {
  const testDir = path.join(testdataDir, "ensure_file_5");

  try {
    await Deno.mkdir(testDir, { recursive: true });

    await assertRejects(
      async () => {
        await ensureFile(testDir);
      },
      Error,
      `Ensure path exists, expected 'file', got 'dir'`,
    );
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("ensureFileSyncIfItExistAsDir", function () {
  const testDir = path.join(testdataDir, "ensure_file_6");

  try {
    Deno.mkdirSync(testDir, { recursive: true });

    assertThrows(
      () => {
        ensureFileSync(testDir);
      },
      Error,
      `Ensure path exists, expected 'file', got 'dir'`,
    );
  } finally {
    Deno.removeSync(testDir, { recursive: true });
  }
});

Deno.test("ensureFileIfInvalidPath", async function () {
  await assertRejects(
    async () => {
      await ensureFile("<invalid>");
    },
    Error,
  );
});

Deno.test("ensureFileSyncIfInvalidPath", function () {
  assertThrows(
    () => {
      ensureFileSync("<invalid>");
    },
    Error,
  );
});
