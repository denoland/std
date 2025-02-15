// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals, assertRejects } from "@std/assert";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeno } from "./_utils.ts";
import { readTextFile } from "./unstable_read_text.ts";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const testDir = resolve(moduleDir, "testdata");
const testFile = join(testDir, "copy_file.txt");

Deno.test("readTextFile() reads content from txt file", async () => {
  const content = await readTextFile(testFile);

  assert(content.length > 0);
  assert(content === "txt");
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

Deno.test("readTextFile() handles an AbortSignal with a reason", async () => {
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
});
