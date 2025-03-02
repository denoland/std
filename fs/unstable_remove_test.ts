// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertRejects, assertThrows } from "@std/assert";
import { rmSync, writeFileSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exists } from "./exists.ts";
import { NotFound } from "./unstable_errors.js";
import { makeTempDir, makeTempDirSync } from "./unstable_make_temp_dir.ts";
import { remove, removeSync } from "./unstable_remove.ts";
import { stat, statSync } from "./unstable_stat.ts";

async function checkExists(path: string | URL) {
  try {
    const stated = await stat(path);
    return stated.isDirectory;
  } catch {
    return false;
  }
}

function checkExistsSync(path: string | URL) {
  try {
    const stated = statSync(path);
    return stated.isDirectory;
  } catch {
    return false;
  }
}

Deno.test("remove() remove an existed and empty directory", async () => {
  const tempDir = await makeTempDir({ prefix: "remove_async_" });
  const existedCheck = await stat(tempDir);
  assert(existedCheck.isDirectory === true);

  try {
    await remove(tempDir);
    const existed = await checkExists(tempDir);
    assert(existed === false);
  } catch {
    await rm(tempDir, { recursive: true });
  }
});

Deno.test("remove() remove a non empty directory", async () => {
  const tempDir1 = await makeTempDir({ prefix: "remove_async_" });
  const tempDir2 = await makeTempDir({
    dir: tempDir1,
    prefix: "remove_async_",
  });
  const testFile1 = join(tempDir1, "test.txt");
  const testFile2 = join(tempDir2, "test.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("This is a test content");
  await writeFile(testFile1, data, { mode: 0o777 });
  await writeFile(testFile2, data, { mode: 0o777 });

  try {
    await assertRejects(async () => {
      await remove(tempDir1);
    }, Error);

    await remove(tempDir1, { recursive: true });
    const existed = await checkExists(tempDir1);
    assert(existed === false);
  } catch {
    await rm(tempDir1, { recursive: true });
  }
});

Deno.test("remove() remove a non existed directory", async () => {
  const tempDir = await makeTempDir({ prefix: "remove_async_" });
  const nonExistedDir = join(tempDir, "non", "existed", "dir");

  try {
    await assertRejects(async () => {
      await remove(nonExistedDir);
    }, NotFound);
    await remove(tempDir);
    const existed = await exists(tempDir);
    assert(existed === false);
  } catch {
    await rm(tempDir, { recursive: true });
  }
});

Deno.test("remove() remove a non existed directory with option", async () => {
  const tempDir = await makeTempDir({ prefix: "remove_async_" });
  const nonExistedDir = join(tempDir, "non", "existed", "dir");

  try {
    await assertRejects(async () => {
      await remove(nonExistedDir, { recursive: true });
    }, NotFound);
    await remove(tempDir);
    const existed = await checkExists(tempDir);
    assert(existed === false);
  } catch {
    await rm(tempDir, { recursive: true });
  }
});

Deno.test("removeSync() remove an existed and empty directory", () => {
  const tempDir = makeTempDirSync({ prefix: "remove_sync_" });
  assert(statSync(tempDir).isDirectory === true);

  try {
    removeSync(tempDir);
    assert(checkExistsSync(tempDir) === false);
  } catch {
    rmSync(tempDir, { recursive: true });
  }
});

Deno.test("removeSync() remove a non empty directory", () => {
  const tempDir1 = makeTempDirSync({ prefix: "remove_sync_" });
  const tempDir2 = makeTempDirSync({
    dir: tempDir1,
    prefix: "remove_async_",
  });
  const testFile1 = join(tempDir1, "test.txt");
  const testFile2 = join(tempDir2, "test.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("This is a test content");
  writeFileSync(testFile1, data, { mode: 0o777 });
  writeFileSync(testFile2, data, { mode: 0o777 });

  try {
    assertThrows(() => {
      removeSync(tempDir1);
    }, Error);

    removeSync(tempDir1, { recursive: true });
    assert(checkExistsSync(tempDir1) === false);
  } catch {
    rmSync(tempDir1, { recursive: true });
  }
});

Deno.test("removeSync() remove a non existed directory", () => {
  const tempDir = makeTempDirSync({ prefix: "remove_sync_" });
  const nonExistedDir = join(tempDir, "non", "existed", "dir");

  try {
    assertThrows(() => {
      removeSync(nonExistedDir);
    }, NotFound);

    removeSync(tempDir, { recursive: true });
    assert(checkExistsSync(tempDir) === false);
  } catch {
    rmSync(tempDir, { recursive: true });
  }
});

Deno.test("removeSync() remove a non existed directory with option", () => {
  const tempDir = makeTempDirSync({ prefix: "remove_sync_" });
  const nonExistedDir = join(tempDir, "non", "existed", "dir");

  try {
    assertThrows(() => {
      removeSync(nonExistedDir, { recursive: true });
    }, NotFound);

    removeSync(tempDir, { recursive: true });
    assert(checkExistsSync(tempDir) === false);
  } catch {
    rmSync(tempDir, { recursive: true });
  }
});
