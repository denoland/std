// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals, assertRejects, assertThrows } from "@std/assert";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeno } from "./_utils.ts";
import { NotFound } from "./unstable_errors.js";
import { readTextFile, readTextFileSync } from "./unstable_read_text_file.ts";

const isBun = navigator.userAgent.includes("Bun/");

const moduleDir = dirname(fileURLToPath(import.meta.url));
const testDir = resolve(moduleDir, "testdata");
const testFile = join(testDir, "copy_file.txt");
const testFile2 = join(testDir, "copy_file_bom.txt");

Deno.test("readTextFile() reads content from txt file", async () => {
  const content = await readTextFile(testFile);

  assert(content.length > 0);
  assert(content === "txt");
});

Deno.test("readTextFile() reads a file with byte order mark", async () => {
  const content = await readTextFile(testFile2);

  assertEquals(content, "\ufeffhello");
});

Deno.test("readTextFile() throws an Error when reading a directory", async () => {
  await assertRejects(async () => {
    await readTextFile(testDir);
  }, Error);
});

Deno.test("readTextFile() handles an AbortSignal", async () => {
  const ac = new AbortController();
  queueMicrotask(() => ac.abort());

  const error = await assertRejects(async () => {
    await readTextFile(testFile, { signal: ac.signal });
  }, Error);

  assertEquals(error.name, "AbortError");
});

Deno.test(
  "readTextFile() handles an AbortSignal with a reason",
  { ignore: isBun },
  async () => {
    const ac = new AbortController();
    const reasonErr = new Error();
    queueMicrotask(() => ac.abort(reasonErr));

    const error = await assertRejects(async () => {
      await readTextFile(testFile, { signal: ac.signal });
    }, Error);

    if (isDeno) {
      assertEquals(error, ac.signal.reason);
    } else {
      assertEquals(error.cause, ac.signal.reason);
    }
  },
);

Deno.test("readTextFileSync() reads content from txt file", () => {
  const content = readTextFileSync(testFile);

  assert(content.length > 0);
  assert(content === "txt");
});

Deno.test("readTextFileSync() reads a file with byte order mark", () => {
  const content = readTextFileSync(testFile2);

  assertEquals(content, "\ufeffhello");
});

Deno.test("readTextFileSync() throws an Error when reading a directory", () => {
  assertThrows(() => {
    readTextFileSync(testDir);
  }, Error);
});

Deno.test("readTextFileSync() throws NotFound when reading through a non-existent file", () => {
  assertThrows(() => {
    readTextFileSync("no-this-file.txt");
  }, NotFound);
});
