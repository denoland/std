// Copyright 2018-2026 the Deno authors. MIT license.

import {
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { chmod, chmodSync } from "./unstable_chmod.ts";
import { NotFound } from "./unstable_errors.js";
import { platform, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { mkdir, mkdtemp, open, rm, stat, symlink } from "node:fs/promises";
import {
  closeSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  rmSync,
  statSync,
  symlinkSync,
} from "node:fs";

Deno.test({
  name: "chmod() sets read only permission bits on regular files",
  ignore: platform() === "win32",
  fn: async () => {
    const tempDirPath = await mkdtemp(resolve(tmpdir(), "chmod_"));
    const testFile = join(tempDirPath, "chmod_file.txt");
    const tempFh = await open(testFile, "w");

    // Check initial testFile permissions are 0o644 (-rw-r--r--).
    const fileStatBefore = await stat(testFile);
    assertExists(fileStatBefore.mode, "mode property is null");
    assertEquals(fileStatBefore.mode & 0o644, 0o644);

    // Set testFile permission bits to read only, 0o444 (-r--r--r--).
    await chmod(testFile, 0o444);
    const fileStatAfter = await stat(testFile);
    assertExists(fileStatAfter.mode, "mode property is null");
    assertEquals(fileStatAfter.mode & 0o444, 0o444);

    await tempFh.close();
    await rm(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test({
  name: "chmod() sets read only permission bits on a directory",
  ignore: platform() === "win32",
  fn: async () => {
    const tempDirPath = await mkdtemp(resolve(tmpdir(), "chmod_"));
    const testDir = resolve(tempDirPath, "testDir");
    await mkdir(testDir);

    // Check initial testDir permissions are 0o755 (drwxr-xr-x).
    const dirStatBefore = await stat(testDir);
    assertExists(dirStatBefore.mode, "mode property is null");
    assertEquals(dirStatBefore.mode & 0o755, 0o755);

    // Set testDir permission bits to read only to 0o444 (dr--r--r--).
    await chmod(testDir, 0o444);
    const dirStatAfter = await stat(testDir);
    assertExists(dirStatAfter.mode, "mode property is null");
    assertEquals(dirStatAfter.mode & 0o444, 0o444);

    await rm(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test({
  name: "chmod() sets write only permission bits of regular file via symlink",
  ignore: platform() === "win32",
  fn: async () => {
    const tempDirPath = await mkdtemp(resolve(tmpdir(), "chmod_"));
    const testFile = resolve(tempDirPath, "chmod_file.txt");
    const testSymlink = resolve(tempDirPath, "chmod_file.txt.link");

    const tempFh = await open(testFile, "w");
    await symlink(testFile, testSymlink);

    // Check initial testFile permission bits are 0o644 (-rw-r-xr-x) reading through testSymlink.
    const symlinkStatBefore = await stat(testSymlink);
    assertExists(symlinkStatBefore.mode, "mode property via symlink is null");
    assertEquals(symlinkStatBefore.mode & 0o644, 0o644);

    // Set write only permission bits of testFile through testSymlink to 0o222 (--w--w--w-).
    await chmod(testSymlink, 0o222);
    const symlinkStatAfter = await stat(testSymlink);
    assertExists(symlinkStatAfter.mode, "mode property via symlink is null");
    const fileStatAfter = await stat(testFile);
    assertExists(fileStatAfter.mode, "mode property via file is null");

    // Check if both regular file mode and the mode read through symlink are both write only.
    assertEquals(symlinkStatAfter.mode, fileStatAfter.mode);

    await tempFh.close();
    await rm(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test("chmod() rejects with NotFound for a non-existent file", async () => {
  await assertRejects(async () => {
    await chmod("non_existent_file.txt", 0o644);
  }, NotFound);
});

Deno.test({
  name: "chmodSync() sets read-only permission bits on regular files",
  ignore: platform() === "win32",
  fn: () => {
    const tempDirPath = mkdtempSync(resolve(tmpdir(), "chmodSync_"));
    const testFile = resolve(tempDirPath, "chmod_file.txt");
    const tempFd = openSync(testFile, "w");

    // Check initial testFile permissions are 0o644 (-rw-r--r--).
    const fileStatBefore = statSync(testFile);
    assertExists(fileStatBefore.mode, "mode property is null");
    assertEquals(fileStatBefore.mode & 0o644, 0o644);

    // Set testFile permission bits to read only, 0o444 (-r--r--r--).
    chmodSync(testFile, 0o444);
    const fileStatAfter = statSync(testFile);
    assertExists(fileStatAfter.mode, "mode property is null");
    assertEquals(fileStatAfter.mode & 0o444, 0o444);

    closeSync(tempFd);
    rmSync(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test({
  name: "chmodSync() sets read-only permissions bits on directories",
  ignore: platform() === "win32",
  fn: () => {
    const tempDirPath = mkdtempSync(resolve(tmpdir(), "chmodSync_"));
    const testDir = resolve(tempDirPath, "testDir");
    mkdirSync(testDir);

    // Check initial testDir permissions are 0o755 (drwxr-xr-x).
    const dirStatBefore = statSync(testDir);
    assertExists(dirStatBefore.mode, "mode property is null");
    assertEquals(dirStatBefore.mode & 0o755, 0o755);

    // Set testDir permission bits to read only to 0o444 (dr--r--r--).
    chmodSync(testDir, 0o444);
    const dirStatAfter = statSync(testDir);
    assertExists(dirStatAfter.mode, "mode property is null");
    assertEquals(dirStatAfter.mode & 0o444, 0o444);

    rmSync(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test({
  name: "chmodSync() sets write only permission on a regular file via symlink",
  ignore: platform() === "win32",
  fn: () => {
    const tempDirPath = mkdtempSync(resolve(tmpdir(), "chmodSync_"));
    const testFile = resolve(tempDirPath, "chmod_file.txt");
    const testSymlink = resolve(tempDirPath, "chmod_file.txt.link");

    const tempFd = openSync(testFile, "w");
    symlinkSync(testFile, testSymlink);

    // Check initial testFile permission bits are 0o644 (-rw-r-xr-x) reading through testSymlink.
    const symlinkStatBefore = statSync(testSymlink);
    assertExists(symlinkStatBefore.mode, "mode property via symlink is null");
    assertEquals(symlinkStatBefore.mode & 0o644, 0o644);

    // Set write only permission bits of testFile through testSymlink to 0o222 (--w--w--w-).
    chmodSync(testSymlink, 0o222);
    const symlinkStatAfter = statSync(testSymlink);
    assertExists(symlinkStatAfter.mode, "mode property via symlink is null");
    const fileStatAfter = statSync(testFile);
    assertExists(fileStatAfter.mode, "mode property via file is null");

    // Check if both regular file mode and the mode read through symlink are both write only.
    assertEquals(symlinkStatAfter.mode, fileStatAfter.mode);

    closeSync(tempFd);
    rmSync(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test("chmodSync() throws with NotFound for a non-existent file", () => {
  assertThrows(() => {
    chmodSync("non_existent_file.txt", 0o644);
  }, NotFound);
});
