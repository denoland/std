// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertThrows, assertThrowsAsync } from "../testing/asserts.ts";
import { ensureSyslink, ensureSyslinkSync } from "./ensure_syslink.ts";
import * as path from "./path/mod.ts";

const testdataDir = path.resolve("fs", "testdata");

test(async function ensureSyslinkIfItNotExist() {
  const testDir = path.join(testdataDir, "ensure_file_1");
  const testFile = path.join(testDir, "test.txt");

  assertThrowsAsync(async () => {
    await ensureSyslink(testFile, path.join(testDir, "test1.txt"));
  });

  assertThrowsAsync(async () => {
    await Deno.stat(testFile).then(() => {
      throw new Error("test file should exists.");
    });
  });
});

test(function ensureSyslinkSyncIfItNotExist() {
  const testDir = path.join(testdataDir, "ensure_file_2");
  const testFile = path.join(testDir, "test.txt");

  assertThrows(() => {
    ensureSyslinkSync(testFile, path.join(testDir, "test1.txt"));
  });

  assertThrows(() => {
    Deno.statSync(testFile);
    throw new Error("test file should exists.");
  });
});

test(async function ensureSyslinkIfItExist() {
  const testDir = path.join(testdataDir, "ensure_file_3");
  const testFile = path.join(testDir, "test.txt");
  const linkFile = path.join(testDir, "link.txt");

  await Deno.mkdir(testDir, true);
  await Deno.writeFile(testFile, new Uint8Array());

  await ensureSyslink(testFile, linkFile);

  assertThrowsAsync(async () => {
    await Deno.lstat(linkFile).then(() => {
      throw new Error("link file should exists.");
    });
  });

  await Deno.remove(testDir, { recursive: true });
});

test(function ensureSyslinkSyncIfItExist() {
  const testDir = path.join(testdataDir, "ensure_file_4");
  const testFile = path.join(testDir, "test.txt");
  const linkFile = path.join(testDir, "link.txt");

  Deno.mkdirSync(testDir, true);
  Deno.writeFileSync(testFile, new Uint8Array());

  ensureSyslinkSync(testFile, linkFile);

  assertThrows(() => {
    Deno.lstatSync(testFile);
    throw new Error("test file should exists.");
  });

  Deno.removeSync(testDir, { recursive: true });
});
