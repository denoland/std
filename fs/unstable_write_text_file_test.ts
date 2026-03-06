// Copyright 2018-2026 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
  unreachable,
} from "@std/assert";
import { isDeno } from "./_utils.ts";
import {
  writeTextFile,
  writeTextFileSync,
} from "./unstable_write_text_file.ts";
import { AlreadyExists, NotFound } from "./unstable_errors.js";
import { makeTempDir, makeTempDirSync } from "./unstable_make_temp_dir.ts";
import { readTextFile, readTextFileSync } from "./unstable_read_text_file.ts";
import { stat, statSync } from "./unstable_stat.ts";
import { remove, removeSync } from "./unstable_remove.ts";
import { join } from "node:path";
import { platform } from "node:os";

const isBun = navigator.userAgent.includes("Bun/");

function assertMissing(path: string | URL) {
  if (pathExists(path)) {
    throw new Error(`File: ${path} exists`);
  }
}

function pathExists(path: string | URL): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

Deno.test("writeTextFile() succeeds in writing to a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  await writeTextFile(testFile, "Hello");
  const data = await readTextFile(testFile);
  assertEquals(data, "Hello");

  await remove(tempDirPath, { recursive: true });
});

Deno.test("writeTextFile() writes with a ReadableStream object", async () => {
  const readStream = new ReadableStream({
    pull(controller) {
      controller.enqueue("Hello");
      controller.enqueue(", Standard");
      controller.enqueue(" Library");
      controller.close();
    },
  });

  const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  await writeTextFile(testFile, readStream);
  const data = await readTextFile(testFile);
  assertEquals(data, "Hello, Standard Library");

  await remove(tempDirPath, { recursive: true });
});

Deno.test("writeTextFile() handles 'append' to a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  await writeTextFile(testFile, "Hello");
  const readBefore = await readTextFile(testFile);
  assertEquals(readBefore, "Hello");

  await writeTextFile(testFile, ", Standard Library", { append: true });
  const readAfter = await readTextFile(testFile);
  assertEquals(readAfter, "Hello, Standard Library");

  // Turn off append to overwrite file.
  await writeTextFile(testFile, "Standard Library", { append: false });
  const readAfterOverwrite = await readTextFile(testFile);
  assertEquals(readAfterOverwrite, "Standard Library");

  await remove(tempDirPath, { recursive: true });
});

Deno.test("writeTextFile() handles 'create' for a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  await assertRejects(async () => {
    await writeTextFile(testFile, "Hello", { create: false });
  }, NotFound);

  await writeTextFile(testFile, "Hello", { create: true });
  const readData = await readTextFile(testFile);
  assertEquals(readData, "Hello");

  await remove(tempDirPath, { recursive: true });
});

Deno.test("writeTextFile() handles 'createNew' for a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  await writeTextFile(testFile, "Hello", { createNew: true });
  const readData = await readTextFile(testFile);
  assertEquals(readData, "Hello");

  await assertRejects(async () => {
    await writeTextFile(testFile, "Hello", { createNew: true });
  }, AlreadyExists);

  await remove(tempDirPath, { recursive: true });
});

Deno.test({
  name: "writeTextFile() can change the mode of a file",
  ignore: platform() === "win32",
  fn: async () => {
    const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
    const testFile = join(tempDirPath, "testFile.txt");

    await writeTextFile(testFile, "Hello");
    const fileStatBefore = await stat(testFile);
    assertExists(fileStatBefore.mode, "mode is null");
    assertEquals(fileStatBefore.mode & 0o777, 0o644);

    await writeTextFile(testFile, "Hello", { mode: 0o222 });
    const fileStatAfter = await stat(testFile);
    assertExists(fileStatAfter.mode, "mode is null");
    assertEquals(fileStatAfter.mode & 0o777, 0o222);

    await remove(tempDirPath, { recursive: true });
  },
});

Deno.test("writeTextFile() handles an AbortSignal", async () => {
  const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
  const testFile = join(tempDirPath, "testFile.txt");
  const ac = new AbortController();
  queueMicrotask(() => ac.abort());

  const error = await assertRejects(async () => {
    await writeTextFile(testFile, "Hello", { signal: ac.signal });
  }, Error);
  assertEquals(error.name, "AbortError");

  await remove(tempDirPath, { recursive: true });
});

Deno.test(
  "writeTextFile() handles an AbortSignal with a reason",
  { ignore: isBun },
  async () => {
    const ac = new AbortController();
    const reasonErr = new Error();
    queueMicrotask(() => ac.abort(reasonErr));

    const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
    const testFile = join(tempDirPath, "testFile.txt");

    const error = await assertRejects(async () => {
      await writeTextFile(testFile, "Hello", { signal: ac.signal });
    }, Error);

    if (isDeno) {
      assertEquals(error, ac.signal.reason);
    } else {
      assertEquals(error.cause, ac.signal.reason);
    }

    await remove(tempDirPath, { recursive: true });
  },
);

Deno.test(
  "writeTextFile() handles an AbortSignal with a primitive reason",
  { ignore: isBun },
  async () => {
    const ac = new AbortController();
    const reasonErr = "This is a primitive string.";
    queueMicrotask(() => ac.abort(reasonErr));

    const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
    const testFile = join(tempDirPath, "testFile.txt");

    try {
      await writeTextFile(testFile, "Hello", { signal: ac.signal });
    } catch (error) {
      if (isDeno) {
        assertEquals(error, ac.signal.reason);
      } else {
        const errorValue = error as Error;
        assertEquals(errorValue.cause, ac.signal.reason);
      }
    }

    await remove(tempDirPath, { recursive: true });
  },
);

Deno.test("writeTextFile() writes to a file successfully with an attached AbortSignal", async () => {
  const ac = new AbortController();
  const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  await writeTextFile(testFile, "Hello", { signal: ac.signal });

  await remove(tempDirPath, { recursive: true });
});

Deno.test("writeTextFile() handles an AbortSignal invoked prior to writing the file", async () => {
  const ac = new AbortController();
  ac.abort();

  const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  try {
    await writeTextFile(testFile, "Hello", { signal: ac.signal });
    unreachable();
  } catch (error) {
    assert(error instanceof Error);
    assert(error.name === "AbortError");
  }
  assertMissing(testFile);
  await remove(tempDirPath, { recursive: true });
});

Deno.test("writeTextFile() rejects with a NotFound when writing to a nonexistent path", async () => {
  const tempDirPath = await makeTempDir({ prefix: "writeTextFile_" });
  const testPath = join(tempDirPath, "dir/testFile.txt");

  await assertRejects(async () => {
    await writeTextFile(testPath, "Hello, Standard Library");
  }, NotFound);

  await remove(tempDirPath, { recursive: true });
});

Deno.test("writeTextFileSync() succeeds in writing to a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "writeTextFileSync_" });
  const testFile = join(tempDirPath, "testFile.txt");

  writeTextFileSync(testFile, "Hello");
  const data = readTextFileSync(testFile);
  assertEquals(data, "Hello");

  removeSync(tempDirPath, { recursive: true });
});

Deno.test({
  name: "writeTextFileSync() can change the mode of a file",
  ignore: platform() === "win32",
  fn: () => {
    const tempDirPath = makeTempDirSync({ prefix: "writeTextFileSync_" });
    const testFile = join(tempDirPath, "testFile.txt");

    writeTextFileSync(testFile, "Hello");
    const fileStatBefore = statSync(testFile);
    assertExists(fileStatBefore.mode, "mode is null");
    assertEquals(fileStatBefore.mode & 0o777, 0o644);

    writeTextFileSync(testFile, "Hello", { mode: 0o222 });
    const fileStatAfter = statSync(testFile);
    assertExists(fileStatAfter.mode, "mode is null");
    assertEquals(fileStatAfter.mode & 0o777, 0o222);

    removeSync(tempDirPath, { recursive: true });
  },
});

Deno.test("writeTextFileSync() handles 'append' to a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "writeTextFileSync_" });
  const testFile = join(tempDirPath, "testFile.txt");

  writeTextFileSync(testFile, "Hello");
  const readBefore = readTextFileSync(testFile);
  assertEquals(readBefore, "Hello");

  writeTextFileSync(testFile, ", Standard Library", { append: true });
  const readAfter = readTextFileSync(testFile);
  assertEquals(readAfter, "Hello, Standard Library");

  // Turn off append to overwrite file.
  writeTextFileSync(testFile, "Standard Library", { append: false });
  const readAfterOverwrite = readTextFileSync(testFile);
  assertEquals(readAfterOverwrite, "Standard Library");

  removeSync(tempDirPath, { recursive: true });
});

Deno.test("writeTextFileSync() handles 'create' for a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "writeTextFileSync_" });
  const testFile = join(tempDirPath, "testFile.txt");

  assertThrows(() => {
    writeTextFileSync(testFile, "Hello", { create: false });
  }, NotFound);

  writeTextFileSync(testFile, "Hello", { create: true });
  const readData = readTextFileSync(testFile);
  assertEquals(readData, "Hello");

  removeSync(tempDirPath, { recursive: true });
});

Deno.test("writeTextFileSync() handles 'createNew' for a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "writeTextFileSync_" });
  const testFile = join(tempDirPath, "testFile.txt");

  writeTextFileSync(testFile, "Hello", { createNew: true });
  const readData = readTextFileSync(testFile);
  assertEquals(readData, "Hello");

  assertThrows(() => {
    writeTextFileSync(testFile, "Hello", { createNew: true });
  }, AlreadyExists);

  removeSync(tempDirPath, { recursive: true });
});

Deno.test("writeTextFileSync() throws with a NotFound when writing to a nonexistent path", () => {
  const tempDirPath = makeTempDirSync({ prefix: "writeTextFileSync_" });
  const testPath = join(tempDirPath, "dir/testFile.txt");

  assertThrows(() => {
    writeTextFileSync(testPath, "Hello, Standard Library");
  }, NotFound);

  removeSync(tempDirPath, { recursive: true });
});
