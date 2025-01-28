// Copyright 2018-2025 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { link, linkSync } from "./unstable_link.ts";
import { AlreadyExists, NotFound } from "./unstable_errors.js";
import { mkdtemp, open, readFile, rm, stat, writeFile } from "node:fs/promises";
import {
  closeSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

Deno.test("link() creates a hard link to a file and mutate through hard link", async () => {
  const tempDirPath = await mkdtemp(resolve(tmpdir(), "link_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const linkFile = join(tempDirPath, "testFile.txt.hardlink");

  const helloWrite = "Hello";
  const testFh = await open(testFile, "w");
  await testFh.writeFile(helloWrite);
  await testFh.close();

  // A single file implicitly has 1 hard link to an inode.
  let testFileStat = await stat(testFile);
  assertExists(testFileStat.nlink, "Hard link count is null");
  assert(testFileStat.nlink === 1);

  // Make another hard link with `link` to the same inode.
  await link(testFile, linkFile);
  testFileStat = await stat(testFile);
  assertExists(testFileStat.nlink, "Hard link count is null");
  assert(testFileStat.nlink === 2);

  // Read test file content through the hard link.
  const testLinkFh = await open(linkFile, "r+");
  const helloRead = await testLinkFh.readFile({ encoding: "utf8" });
  assertEquals(helloRead, helloWrite);
  await testLinkFh.close();

  // Overwrite file content through hard link and read through testFile.
  const stdWrite = "Standard Library";
  await writeFile(linkFile, stdWrite);
  const stdRead = await readFile(testFile, { encoding: "utf8" });
  assertEquals(stdRead, stdWrite);

  // Remove testFile, count links, and check hard link properties.
  await rm(testFile);
  const linkFileStat = await stat(linkFile);
  assertExists(linkFileStat.nlink, "Hard link count is null");
  assert(linkFileStat.nlink === 1);
  assert(linkFileStat.isFile());
  assert(!linkFileStat.isSymbolicLink());

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("link() rejects with AlreadyExists when hard linking with an existing path", async () => {
  const tempDirPath = await mkdtemp(resolve(tmpdir(), "link_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const anotherFile = join(tempDirPath, "anotherFile.txt");

  const testFh = await open(testFile, "w");
  await testFh.close();
  const anotherFh = await open(anotherFile, "w");
  await anotherFh.close();

  assertRejects(async () => {
    await link(testFile, anotherFile);
  }, AlreadyExists);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("link() rejects with NotFound with a non-existent file", async () => {
  await assertRejects(async () => {
    await link("non-existent-file.txt", "non-existent-hard-link");
  }, NotFound);
});

Deno.test("linkSync() creates a hard link to a file and mutate through hard link", () => {
  const tempDirPath = mkdtempSync(resolve(tmpdir(), "linkSync_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const linkFile = join(tempDirPath, "testFile.txt.hardlink");

  const helloWrite = "Hello";
  writeFileSync(testFile, helloWrite);

  // A single file implicitly has 1 hard link to an inode.
  let testFileStat = statSync(testFile);
  assertExists(testFileStat.nlink, "Hard link count is null");
  assert(testFileStat.nlink === 1);

  // Make another hard link with `link` to the same inode.
  linkSync(testFile, linkFile);
  testFileStat = statSync(testFile);
  assertExists(testFileStat.nlink, "Hard link count is null");
  assert(testFileStat.nlink === 2);

  // Read test file content through the hard link.
  const helloRead = readFileSync(linkFile, { encoding: "utf8" });
  assertEquals(helloRead, helloWrite);

  // Overwrite file content through hard link and read through testFile.
  const stdWrite = "Standard Library";
  writeFileSync(linkFile, stdWrite);
  const stdRead = readFileSync(testFile, { encoding: "utf8" });
  assertEquals(stdRead, stdWrite);

  // Remove testFile, count links, and check hard link properties.
  rmSync(testFile);
  const linkFileStat = statSync(linkFile);
  assertExists(linkFileStat.nlink, "Hard link count is null");
  assert(linkFileStat.nlink === 1);
  assert(linkFileStat.isFile());
  assert(!linkFileStat.isSymbolicLink());

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("linkSync() throws with AlreadyExists when hard linking with an existing path", () => {
  const tempDirPath = mkdtempSync(resolve(tmpdir(), "link_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const anotherFile = join(tempDirPath, "anotherFile.txt");

  const testFd = openSync(testFile, "w");
  closeSync(testFd);
  const anotherFd = openSync(anotherFile, "w");
  closeSync(anotherFd);

  assertThrows(() => {
    linkSync(testFile, anotherFile);
  }, AlreadyExists);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("linkSync() throws with NotFound with a non-existent file", () => {
  assertThrows(() => {
    linkSync("non-existent-file.txt", "non-existent-hard-link");
  }, NotFound);
});
