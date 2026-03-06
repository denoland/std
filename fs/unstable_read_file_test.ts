// Copyright 2018-2026 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertRejects,
  assertThrows,
  unreachable,
} from "@std/assert";
import { readFile, readFileSync } from "./unstable_read_file.ts";
import { NotFound } from "./unstable_errors.js";
import { isDeno } from "./_utils.ts";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const isBun = navigator.userAgent.includes("Bun/");

const moduleDir = dirname(fileURLToPath(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");
const testFile = join(testdataDir, "copy_file.txt");

Deno.test("readFile() reads a file", async () => {
  const decoder = new TextDecoder("utf-8");
  const data = await readFile(testFile);

  assert(data.byteLength > 0);
  assertEquals(decoder.decode(data), "txt");
});

Deno.test("readFile() is called repeatedly", async () => {
  for (let i = 0; i < 256; i++) {
    await readFile(testFile);
  }
});

Deno.test("readFile() rejects with Error when reading a file path to a directory", async () => {
  await assertRejects(async () => {
    await readFile(testdataDir);
  }, Error);
});

Deno.test("readFile() handles an AbortSignal", async () => {
  const ac = new AbortController();
  queueMicrotask(() => ac.abort());

  const error = await assertRejects(async () => {
    await readFile(testFile, { signal: ac.signal });
  }, Error);
  assertEquals(error.name, "AbortError");
});

Deno.test(
  "readFile() handles an AbortSignal with a reason",
  { ignore: isBun },
  async () => {
    const ac = new AbortController();
    const reasonErr = new Error();
    queueMicrotask(() => ac.abort(reasonErr));

    const error = await assertRejects(async () => {
      await readFile(testFile, { signal: ac.signal });
    }, Error);

    if (isDeno) {
      assertEquals(error, ac.signal.reason);
    } else {
      assertEquals(error.cause, ac.signal.reason);
    }
  },
);

Deno.test(
  "readFile() handles an AbortSignal with a primitive reason value",
  { ignore: isBun },
  async () => {
    const ac = new AbortController();
    const reasonErr = "Some string";
    queueMicrotask(() => ac.abort(reasonErr));

    try {
      await readFile(testFile, { signal: ac.signal });
      unreachable();
    } catch (error) {
      if (isDeno) {
        assertEquals(error, ac.signal.reason);
      } else {
        const errorValue = error as Error;
        assertEquals(errorValue.cause, ac.signal.reason);
      }
    }
  },
);

Deno.test("readFile() handles cleanup of an AbortController", async () => {
  const ac = new AbortController();
  await readFile(testFile, { signal: ac.signal });
});

Deno.test("readFile() rejects with NotFound when reading from a non-existent file", async () => {
  await assertRejects(async () => {
    await readFile("non-existent-file.txt");
  }, NotFound);
});

Deno.test("readFileSync() reads a file", () => {
  const decoder = new TextDecoder("utf-8");
  const data = readFileSync(testFile);

  assert(data.byteLength > 0);
  assertEquals(decoder.decode(data), "txt");
});

Deno.test("readFileSync() is called repeatedly", () => {
  for (let i = 0; i < 256; i++) {
    readFileSync(testFile);
  }
});

Deno.test("readFileSync() throws with Error when reading a file path to a directory", () => {
  assertThrows(() => {
    readFileSync(testdataDir);
  }, Error);
});

Deno.test("readFileSync() throws with NotFound when reading from a non-existent file", () => {
  assertThrows(() => {
    readFileSync("non-existent-file.txt");
  }, NotFound);
});
