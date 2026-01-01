// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { truncate, truncateSync } from "./unstable_truncate.ts";
import { NotFound } from "./unstable_errors.js";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const isBun = navigator.userAgent.includes("Bun/");

Deno.test("truncate() succeeds in truncating file sizes", async () => {
  const tempDataDir = await mkdtemp(resolve(tmpdir(), "truncate_"));
  const testFile = join(tempDataDir, "truncFile.txt");
  await writeFile(testFile, "Hello, Standard Library");

  await truncate(testFile, 30);
  assertEquals((await readFile(testFile)).length, 30);
  await truncate(testFile, 10);
  assertEquals((await readFile(testFile)).length, 10);
  await truncate(testFile, -5);
  assertEquals((await readFile(testFile)).length, 0);

  await rm(tempDataDir, { recursive: true, force: true });
});

Deno.test(
  "truncate() truncates the file to zero when 'len' is not provided",
  { ignore: isBun },
  async () => {
    const tempDataDir = await mkdtemp(resolve(tmpdir(), "truncate_"));
    const testFile = join(tempDataDir, "truncFile.txt");
    await writeFile(testFile, "Hello, Standard Library");

    await truncate(testFile);
    assertEquals((await readFile(testFile)).length, 0);

    await rm(tempDataDir, { recursive: true, force: true });
  },
);

Deno.test("truncate() rejects with Error when passing a non-regular file", async () => {
  const tempDataDir = await mkdtemp(resolve(tmpdir(), "truncate_"));

  await assertRejects(async () => {
    await truncate(tempDataDir);
  }, Error);

  await rm(tempDataDir, { recursive: true, force: true });
});

Deno.test(
  "truncate() rejects with NotFound with a non-existent file",
  { ignore: isBun },
  async () => {
    await assertRejects(async () => {
      await truncate("non-existent-file.txt");
    }, NotFound);
  },
);

Deno.test("truncateSync() succeeds in truncating file sizes", () => {
  const tempDataDir = mkdtempSync(resolve(tmpdir(), "truncateSync_"));
  const testFile = join(tempDataDir, "truncFile.txt");
  writeFileSync(testFile, "Hello, Standard Library");

  truncateSync(testFile, 30);
  assertEquals((readFileSync(testFile)).length, 30);
  truncateSync(testFile, 10);
  assertEquals((readFileSync(testFile)).length, 10);
  truncateSync(testFile, -5);
  assertEquals((readFileSync(testFile)).length, 0);

  rmSync(tempDataDir, { recursive: true, force: true });
});

Deno.test(
  "truncateSync() truncates the file to zero when 'len' is not provided",
  { ignore: isBun },
  () => {
    const tempDataDir = mkdtempSync(resolve(tmpdir(), "truncateSync_"));
    const testFile = join(tempDataDir, "truncFile.txt");
    writeFileSync(testFile, "Hello, Standard Library");

    truncateSync(testFile);
    assertEquals((readFileSync(testFile)).length, 0);

    rmSync(tempDataDir, { recursive: true, force: true });
  },
);

Deno.test("truncateSync() throws with Error with a non-regular file", () => {
  const tempDataDir = mkdtempSync(resolve(tmpdir(), "truncateSync_"));

  assertThrows(() => {
    truncateSync(tempDataDir);
  }, Error);

  rmSync(tempDataDir, { recursive: true, force: true });
});

Deno.test(
  "truncateSync() throws with NotFound with a non-existent file",
  { ignore: isBun },
  () => {
    assertThrows(() => {
      truncateSync("non-existent-file.txt");
    }, NotFound);
  },
);
