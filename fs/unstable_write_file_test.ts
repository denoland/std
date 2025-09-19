// Copyright 2018-2025 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
  unreachable,
} from "@std/assert";
import { isDeno } from "./_utils.ts";
import { writeFile, writeFileSync } from "./unstable_write_file.ts";
import { makeTempDir, makeTempDirSync } from "./unstable_make_temp_dir.ts";
import { readFile, readFileSync } from "./unstable_read_file.ts";
import { stat, statSync } from "./unstable_stat.ts";
import { AlreadyExists, NotFound } from "./unstable_errors.js";
import { rmSync } from "node:fs";
import { rm } from "node:fs/promises";
import { platform } from "node:os";
import { join } from "node:path";

const isBun = navigator.userAgent.includes("Bun/");

function assertMissing(path: string | URL) {
  if (pathExists(path)) {
    throw new Error("File: ${path} exists");
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

Deno.test("writeFile() writes to a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");
  await writeFile(testFile, data);

  const dataRead = await readFile(testFile);
  const decoder = new TextDecoder("utf-8");
  const actualData = decoder.decode(dataRead);
  assertEquals(actualData, "Hello");

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("writeFile() handles 'append' to a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");
  await writeFile(testFile, data);

  const dataRead = await readFile(testFile);
  const decoder = new TextDecoder("utf-8");
  const initialData = decoder.decode(dataRead);
  assertEquals(initialData, "Hello");

  const appendData = encoder.encode(", Standard Library");
  await writeFile(testFile, appendData, { append: true });

  const appendRead = await readFile(testFile);
  const afterAppendData = decoder.decode(appendRead);
  assertEquals(afterAppendData, "Hello, Standard Library");

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("writeFile() handles 'create' when writing to a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");

  // Rejects with NotFound when file does not initally exist.
  await assertRejects(async () => {
    await writeFile(testFile, data, { create: false });
  }, NotFound);

  // Creates a file that does not initially exist. (This is default behavior).
  await writeFile(testFile, data, { create: true });
  const dataRead = await readFile(testFile);
  const decoder = new TextDecoder("utf-8");
  const initialData = decoder.decode(dataRead);
  assertEquals(initialData, "Hello");

  // Overwrites the existing file with new content.
  const dataAgain = encoder.encode("Hello, Standard Library");
  await writeFile(testFile, dataAgain, { create: false });
  const dataReadAgain = await readFile(testFile);
  const readDataAgain = decoder.decode(dataReadAgain);
  assertEquals(readDataAgain, "Hello, Standard Library");

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("writeFile() handles 'createNew' when writing to a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");
  await writeFile(testFile, data, { createNew: true });

  await assertRejects(async () => {
    await writeFile(testFile, data, { createNew: true });
  }, AlreadyExists);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test({
  name: "writeFile() can change the mode of a file",
  ignore: platform() === "win32",
  fn: async () => {
    const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
    const testFile = join(tempDirPath, "testFile.txt");

    const encoder = new TextEncoder();
    const data = encoder.encode("Hello");

    await writeFile(testFile, data);
    const testFileStatBefore = await stat(testFile);
    assertExists(testFileStatBefore.mode, "mode is null");
    assertEquals(testFileStatBefore.mode & 0o777, 0o644);

    await writeFile(testFile, data, { mode: 0o222 });
    const testFileStatAfter = await stat(testFile);
    assertExists(testFileStatAfter.mode, "mode is null");
    assertEquals(testFileStatAfter.mode & 0o777, 0o222);

    await rm(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test("writeFile() writes to a file with a ReadableStream instance", async () => {
  const readStream = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array([1]));
      controller.enqueue(new Uint8Array([2]));
      controller.close();
    },
  });

  const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  await writeFile(testFile, readStream);
  assertEquals(await readFile(testFile), new Uint8Array([1, 2]));

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("writeFile() handles an AbortSignal", async () => {
  const ac = new AbortController();
  queueMicrotask(() => ac.abort());

  const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");

  const error = await assertRejects(async () => {
    await writeFile(testFile, data, { signal: ac.signal });
  }, Error);
  assertEquals(error.name, "AbortError");

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test(
  "writeFile() handles an AbortSignal with a reason",
  { ignore: isBun },
  async () => {
    const ac = new AbortController();
    const reasonErr = new Error();
    queueMicrotask(() => ac.abort(reasonErr));

    const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
    const testFile = join(tempDirPath, "testFile.txt");

    const encoder = new TextEncoder();
    const data = encoder.encode("Hello");

    const error = await assertRejects(async () => {
      await writeFile(testFile, data, { signal: ac.signal });
    }, Error);

    if (isDeno) {
      assertEquals(error, ac.signal.reason);
    } else {
      assertEquals(error.cause, ac.signal.reason);
    }

    await rm(tempDirPath, { recursive: true, force: true });
  },
);

Deno.test(
  "writeFile() handles an AbortSignal with a primitive value",
  { ignore: isBun },
  async () => {
    const ac = new AbortController();
    const reasonErr = "This is a primitive string";
    queueMicrotask(() => ac.abort(reasonErr));

    const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
    const testFile = join(tempDirPath, "testFile.txt");

    const encoder = new TextEncoder();
    const data = encoder.encode("Hello");

    try {
      await writeFile(testFile, data, { signal: ac.signal });
    } catch (error) {
      if (isDeno) {
        assertEquals(error, ac.signal.reason);
      } else {
        const errorValue = error as Error;
        assertEquals(errorValue.cause, ac.signal.reason);
      }
      await rm(tempDirPath, { recursive: true, force: true });
    }
  },
);

Deno.test("writeFile() writes to a file successfully with an attached AbortSignal", async () => {
  const ac = new AbortController();

  const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");

  await writeFile(testFile, data, { signal: ac.signal });

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("writeFile() handles an AbortSignal invoked prior to writing the file", async () => {
  const ac = new AbortController();
  ac.abort();

  const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");

  try {
    await writeFile(testFile, data, { signal: ac.signal });
    unreachable();
  } catch (error) {
    assert(error instanceof Error);
    assert(error.name === "AbortError");
  }
  assertMissing(testFile);
  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("writeFile() rejects with NotFound when writing data to a non-existent path", async () => {
  const tempDirPath = await makeTempDir({ prefix: "writeFile_" });
  // The path contains a non-existent directory making the path non-existent.
  const notFoundPath = join("dir/testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");

  await assertRejects(async () => {
    await writeFile(notFoundPath, data);
  }, NotFound);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("writeFileSync() writes to a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "writeFileSync_ " });
  const testFile = join(tempDirPath, "testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");
  writeFileSync(testFile, data);

  const dataRead = readFileSync(testFile);
  const decoder = new TextDecoder("utf-8");
  const actualData = decoder.decode(dataRead);
  assertEquals(actualData, "Hello");

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("writeFileSync() handles 'append' to a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "writeFileSync_" });
  const testFile = join(tempDirPath, "testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");
  writeFileSync(testFile, data);

  const dataRead = readFileSync(testFile);
  const decoder = new TextDecoder("utf-8");
  const initialData = decoder.decode(dataRead);
  assertEquals(initialData, "Hello");

  const appendData = encoder.encode(", Standard Library");
  writeFileSync(testFile, appendData, { append: true });

  const appendRead = readFileSync(testFile);
  const afterAppendData = decoder.decode(appendRead);
  assertEquals(afterAppendData, "Hello, Standard Library");

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("writeFileSync() handles 'create' when writing to a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "writeFileSync_" });
  const testFile = join(tempDirPath, "testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");

  // Throws with NotFound when file does not initally exist.
  assertThrows(() => {
    writeFileSync(testFile, data, { create: false });
  }, NotFound);

  // Creates a file that does not initially exist. (This is default behavior).
  writeFileSync(testFile, data, { create: true });
  const dataRead = readFileSync(testFile);
  const decoder = new TextDecoder("utf-8");
  const initialData = decoder.decode(dataRead);
  assertEquals(initialData, "Hello");

  // Overwrites the existing file with new content.
  const dataAgain = encoder.encode("Hello, Standard Library");
  writeFileSync(testFile, dataAgain, { create: false });
  const dataReadAgain = readFileSync(testFile);
  const readDataAgain = decoder.decode(dataReadAgain);
  assertEquals(readDataAgain, "Hello, Standard Library");

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("writeFileSync() handles 'createNew' when writing to a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "writeFile_" });
  const testFile = join(tempDirPath, "testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");
  writeFileSync(testFile, data, { createNew: true });

  assertThrows(() => {
    writeFileSync(testFile, data, { createNew: true });
  }, AlreadyExists);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test({
  name: "writeFileSync() can change the mode of a file",
  ignore: platform() === "win32",
  fn: () => {
    const tempDirPath = makeTempDirSync({ prefix: "writeFileSync_" });
    const testFile = join(tempDirPath, "testFile.txt");

    const encoder = new TextEncoder();
    const data = encoder.encode("Hello");

    writeFileSync(testFile, data);
    const testFileStatBefore = statSync(testFile);
    assertExists(testFileStatBefore.mode, "mode is null");
    assertEquals(testFileStatBefore.mode & 0o777, 0o644);

    writeFileSync(testFile, data, { mode: 0o222 });
    const testFileStatAfter = statSync(testFile);
    assertExists(testFileStatAfter.mode, "mode is null");
    assertEquals(testFileStatAfter.mode & 0o777, 0o222);

    rmSync(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test("writeFileSync() throws NotFound when writing data to a non-existent path", () => {
  const tempDirPath = makeTempDirSync({ prefix: "writeFileSync_" });
  // The path contains a non-existent directory making the path non-existent.
  const notFoundPath = join("dir/testFile.txt");

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello");

  assertThrows(() => {
    writeFileSync(notFoundPath, data);
  }, NotFound);

  rmSync(tempDirPath, { recursive: true, force: true });
});
