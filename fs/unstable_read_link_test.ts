// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { readLink, readLinkSync } from "./unstable_read_link.ts";
import { NotFound } from "./unstable_errors.js";
import {
  linkSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { link, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

Deno.test("readLink() can read through symlink", async () => {
  const tempDirPath = await mkdtemp(resolve(tmpdir(), "readLink_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const symlinkFile = join(tempDirPath, "testFile.txt.link");

  await writeFile(testFile, "Hello, Standard Library");
  await symlink(testFile, symlinkFile);

  const realFile = await readLink(symlinkFile);
  assertEquals(testFile, realFile);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("readLink() rejects with Error when reading from a hard link", async () => {
  const tempDirPath = await mkdtemp(resolve(tmpdir(), "readLink_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const linkFile = join(tempDirPath, "testFile.txt.hlink");

  await writeFile(testFile, "Hello, Standard Library");
  await link(testFile, linkFile);

  await assertRejects(async () => {
    await readLink(linkFile);
  }, Error);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("readLink() rejects with NotFound when reading through a non-existent file", async () => {
  await assertRejects(async () => {
    await readLink("non-existent-file.txt.link");
  }, NotFound);
});

Deno.test("readLinkSync() can read through symlink", () => {
  const tempDirPath = mkdtempSync(resolve(tmpdir(), "readLink_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const symlinkFile = join(tempDirPath, "testFile.txt.link");

  writeFileSync(testFile, "Hello, Standard Library");
  symlinkSync(testFile, symlinkFile);

  const realFile = readLinkSync(symlinkFile);
  assertEquals(testFile, realFile);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("readLinkSync() throws Error when reading from a hard link", () => {
  const tempDirPath = mkdtempSync(resolve(tmpdir(), "readLinkSync_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const linkFile = join(tempDirPath, "testFile.txt.hlink");

  writeFileSync(testFile, "Hello, Standard Library!");
  linkSync(testFile, linkFile);

  assertThrows(() => {
    readLinkSync(linkFile);
  }, Error);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("readLinkSync() throws NotFound when reading through a non-existent file", () => {
  assertThrows(() => {
    readLinkSync("non-existent-file.txt.hlink");
  }, NotFound);
});
