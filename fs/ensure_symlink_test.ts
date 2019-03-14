// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import {
  assertEquals,
  assertThrows,
  assertThrowsAsync
} from "../testing/asserts.ts";
import { ensureSymlink, ensureSymlinkSync } from "./ensure_symlink.ts";
import * as path from "./path/mod.ts";

const testdataDir = path.resolve("fs", "testdata");

test(async function ensureSymlinkIfItNotExist() {
  const testDir = path.join(testdataDir, "link_file_1");
  const testFile = path.join(testDir, "test.txt");

  assertThrowsAsync(async () => {
    await ensureSymlink(testFile, path.join(testDir, "test1.txt"));
  });

  assertThrowsAsync(async () => {
    await Deno.stat(testFile).then(() => {
      throw new Error("test file should exists.");
    });
  });
});

test(function ensureSymlinkSyncIfItNotExist() {
  const testDir = path.join(testdataDir, "link_file_2");
  const testFile = path.join(testDir, "test.txt");

  assertThrows(() => {
    ensureSymlinkSync(testFile, path.join(testDir, "test1.txt"));
  });

  assertThrows(() => {
    Deno.statSync(testFile);
    throw new Error("test file should exists.");
  });
});

test(async function ensureSymlinkIfItExist() {
  const testDir = path.join(testdataDir, "link_file_3");
  const testFile = path.join(testDir, "test.txt");
  const linkFile = path.join(testDir, "link.txt");

  await Deno.mkdir(testDir, true);
  await Deno.writeFile(testFile, new Uint8Array());

  await ensureSymlink(testFile, linkFile);

  const srcStat = await Deno.lstat(testFile);
  const linkStat = await Deno.lstat(linkFile);

  assertEquals(srcStat.isFile(), true);
  assertEquals(linkStat.isSymlink(), true);

  await Deno.remove(testDir, { recursive: true });
});

test(function ensureSymlinkSyncIfItExist() {
  const testDir = path.join(testdataDir, "link_file_4");
  const testFile = path.join(testDir, "test.txt");
  const linkFile = path.join(testDir, "link.txt");

  Deno.mkdirSync(testDir, true);
  Deno.writeFileSync(testFile, new Uint8Array());

  ensureSymlinkSync(testFile, linkFile);

  const srcStat = Deno.lstatSync(testFile);

  const linkStat = Deno.lstatSync(linkFile);

  assertEquals(srcStat.isFile(), true);
  assertEquals(linkStat.isSymlink(), true);

  Deno.removeSync(testDir, { recursive: true });
});

test(async function ensureSymlinkDirectoryIfItExist() {
  const testDir = path.join(testdataDir, "link_file_origin_3");
  const linkDir = path.join(testdataDir, "link_file_link_3");
  const testFile = path.join(testDir, "test.txt");

  await Deno.mkdir(testDir, true);
  await Deno.writeFile(testFile, new Uint8Array());

  await ensureSymlink(testDir, linkDir);

  const testDirStat = await Deno.lstat(testDir);
  const linkDirStat = await Deno.lstat(linkDir);
  const testFileStat = await Deno.lstat(testFile);

  assertEquals(testFileStat.isFile(), true);
  assertEquals(testDirStat.isDirectory(), true);
  assertEquals(linkDirStat.isSymlink(), true);

  await Deno.remove(linkDir, { recursive: true });
  await Deno.remove(testDir, { recursive: true });
});

test(function ensureSymlinkSyncDirectoryIfItExist() {
  const testDir = path.join(testdataDir, "link_file_origin_3");
  const linkDir = path.join(testdataDir, "link_file_link_3");
  const testFile = path.join(testDir, "test.txt");

  Deno.mkdirSync(testDir, true);
  Deno.writeFileSync(testFile, new Uint8Array());

  ensureSymlinkSync(testDir, linkDir);

  const testDirStat = Deno.lstatSync(testDir);
  const linkDirStat = Deno.lstatSync(linkDir);
  const testFileStat = Deno.lstatSync(testFile);

  assertEquals(testFileStat.isFile(), true);
  assertEquals(testDirStat.isDirectory(), true);
  assertEquals(linkDirStat.isSymlink(), true);

  Deno.removeSync(linkDir, { recursive: true });
  Deno.removeSync(testDir, { recursive: true });
});
