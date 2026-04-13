// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertRejects, assertThrows } from "@std/assert";
import { symlink, symlinkSync } from "./unstable_symlink.ts";
import { AlreadyExists } from "./unstable_errors.js";
import { lstat, mkdir, mkdtemp, open, rm, stat } from "node:fs/promises";
import {
  closeSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");

Deno.test("symlink() creates a link to a regular file", async () => {
  const tempDirPath = await mkdtemp(resolve(tmpdir(), "symlink_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const symlinkPath = join(tempDirPath, "testFile.txt.link");

  const tempFh = await open(testFile, "w");
  await symlink(testFile, symlinkPath);

  const symlinkLstat = await lstat(symlinkPath);
  const fileStat = await stat(testFile);

  assert(symlinkLstat.isSymbolicLink);
  assert(fileStat.isFile);

  await tempFh.close();
  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("symlink() creates a link to a directory", async () => {
  const tempDirPath = await mkdtemp(resolve(tmpdir(), "symlink_"));
  const testDir = join(tempDirPath, "testDir");
  const symlinkPath = join(tempDirPath, "testDir.link");

  await mkdir(testDir);
  await symlink(testDir, symlinkPath);

  const symlinkLstat = await lstat(symlinkPath);
  const dirStat = await stat(testDir);

  assert(symlinkLstat.isSymbolicLink);
  assert(dirStat.isDirectory);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test(
  "symlink() rejects with AlreadyExists for creating the same link path to the same file path",
  async () => {
    const existingFile = join(testdataDir, "0.ts");
    const existingSymlink = join(testdataDir, "0-link");

    await assertRejects(async () => {
      await symlink(existingFile, existingSymlink);
    }, AlreadyExists);
  },
);

Deno.test(
  "symlinkSync() creates a link to a regular file",
  () => {
    const tempDirPath = mkdtempSync(resolve(tmpdir(), "symlinkSync_"));
    const filePath = join(tempDirPath, "testFile.txt");
    const symlinkPath = join(tempDirPath, "testFile.txt.link");

    const tempFd = openSync(filePath, "w");
    symlinkSync(filePath, symlinkPath);

    const symlinkLstat = lstatSync(symlinkPath);
    const fileStat = statSync(filePath);

    assert(symlinkLstat.isSymbolicLink);
    assert(fileStat.isFile);

    closeSync(tempFd);
    rmSync(tempDirPath, { recursive: true, force: true });
  },
);

Deno.test("symlinkSync() creates a link to a directory", () => {
  const tempDirPath = mkdtempSync(resolve(tmpdir(), "symlinkSync_"));
  const testDir = join(tempDirPath, "testDir");
  const symlinkPath = join(tempDirPath, "testDir.link");

  mkdirSync(testDir);
  symlinkSync(testDir, symlinkPath);

  const symlinkLstat = lstatSync(symlinkPath);
  const dirStat = statSync(testDir);

  assert(symlinkLstat.isSymbolicLink);
  assert(dirStat.isDirectory);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test(
  "symlinkSync() throws with AlreadyExists for creating the same link path to the same file path",
  () => {
    const existingFile = join(testdataDir, "0.ts");
    const existingSymlink = join(testdataDir, "0-link");

    assertThrows(() => {
      symlinkSync(existingFile, existingSymlink);
    }, AlreadyExists);
  },
);
