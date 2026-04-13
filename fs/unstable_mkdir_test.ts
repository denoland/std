// Copyright 2018-2026 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { AlreadyExists } from "./unstable_errors.js";
import { mkdir, mkdirSync } from "./unstable_mkdir.ts";
import { makeTempDir, makeTempDirSync } from "./unstable_make_temp_dir.ts";
import { lstatSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { rm, symlink, writeFile } from "node:fs/promises";
import { platform } from "node:os";
import { join } from "node:path";
import { umask } from "node:process";

function assertDirectory(path: string, expectMode?: number) {
  const dirStat = lstatSync(path);
  assert(dirStat.isDirectory());
  if (platform() !== "win32" && expectMode !== undefined) {
    assertExists(dirStat.mode);
    assertEquals(dirStat.mode & 0o777, expectMode & ~umask(0o022));
  }
}

Deno.test("mkdir() creates a directory with the default mode", async () => {
  const tempDirPath = await makeTempDir({ prefix: "mkdir_" });
  const testDir = join(tempDirPath, "testDir");

  await mkdir(testDir);
  assertDirectory(testDir, 0o755);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("mkdir() creates a directory with a user-defined mode", async () => {
  const tempDirPath = await makeTempDir({ prefix: "mkdir_" });
  const testDir = join(tempDirPath, "testDir");

  await mkdir(testDir, { mode: 0o700 });
  assertDirectory(testDir, 0o700);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("mkdir() recursively creates directories with the default mode", async () => {
  const tempDirPath = await makeTempDir({ prefix: "mkdir_" });
  const recurPath = join(tempDirPath, "nested/dir");
  const nestedDir = join(tempDirPath, "nested");

  await mkdir(recurPath, { recursive: true });
  assertDirectory(recurPath, 0o755);
  assertDirectory(nestedDir, 0o755);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("mkdir() allows creating the same directory with the recursive flag", async () => {
  const tempDirPath = await makeTempDir({ prefix: "mkdir_" });
  const testDir = join(tempDirPath, "dir");

  await mkdir(testDir);
  await mkdir(testDir, { recursive: true });
  await mkdir(testDir, { recursive: true, mode: 0o731 });

  // The directory retains the same mode when initially created.
  assertDirectory(testDir, 0o755);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("mkdir() rejects with AlreadyExists when creating an existing directory", async () => {
  await assertRejects(async () => {
    await mkdir(".");
  }, AlreadyExists);
});

Deno.test("mkdir() rejects with AlreadyExists when creating a directory that is the same name as a regular file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "mkdir_" });
  const testFile = join(tempDirPath, "a-file.txt");
  await writeFile(testFile, "Hello, Standard Library");

  await assertRejects(async () => {
    await mkdir(testFile, { recursive: false });
  }, AlreadyExists);

  await assertRejects(async () => {
    await mkdir(testFile, { recursive: true });
  }, AlreadyExists);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test({
  name:
    "mkdir() rejects with AlreadyExists when creating a directory on symlinks",
  ignore: platform() === "win32",
  fn: async () => {
    const tempDirPath = await makeTempDir({ prefix: "mkdir_" });
    const testDir = join(tempDirPath, "dir");
    const noFile = join(tempDirPath, "nonexistent");
    const testDirLink = join(tempDirPath, "testDirLink");
    const noFileLink = join(tempDirPath, "noFileSymlink");

    await mkdir(testDir);
    await symlink(testDir, testDirLink);
    await symlink(noFile, noFileLink);

    await assertRejects(async () => {
      await mkdir(noFileLink);
    }, AlreadyExists);

    await assertRejects(async () => {
      await mkdir(testDirLink);
    }, AlreadyExists);

    await rm(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test("mkdirSync() creates a directory with the default mode", () => {
  const tempDirPath = makeTempDirSync({ prefix: "mkdirSync_" });
  const testDir = join(tempDirPath, "testDir");

  mkdirSync(testDir);
  assertDirectory(testDir, 0o755);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("mkdirSync() creates a directory with a user-defined mode", () => {
  const tempDirPath = makeTempDirSync({ prefix: "mkdirSync_" });
  const testDir = join(tempDirPath, "testDir");

  mkdirSync(testDir, { mode: 0o700 });
  assertDirectory(testDir, 0o700);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("mkdirSync() recursively creates directories with the default mode", () => {
  const tempDirPath = makeTempDirSync({ prefix: "mkdirSync_" });
  const recurPath = join(tempDirPath, "nested/dir");
  const nestedDir = join(tempDirPath, "nested");

  mkdirSync(recurPath, { recursive: true });
  assertDirectory(recurPath, 0o755);
  assertDirectory(nestedDir, 0o755);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("mkdirSync() allows creating the same directory with the recursive flag", () => {
  const tempDirPath = makeTempDirSync({ prefix: "mkdirSync_" });
  const testDir = join(tempDirPath, "dir");

  mkdirSync(testDir);
  mkdirSync(testDir, { recursive: true });
  mkdirSync(testDir, { recursive: true, mode: 0o731 });

  // The directory retains the same mode when initially created.
  assertDirectory(testDir, 0o755);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("mkdirSync() throws with AlreadyExists when creating an existing directory", () => {
  assertThrows(() => {
    mkdirSync(".");
  }, AlreadyExists);
});

Deno.test("mkdirSync() throws with AlreadyExists when creating a directory that is the same name as a regular file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "mkdirSync_" });
  const testFile = join(tempDirPath, "a-file.txt");
  writeFileSync(testFile, "Hello, Standard Library");

  assertThrows(() => {
    mkdirSync(testFile, { recursive: false });
  }, AlreadyExists);

  assertThrows(() => {
    mkdirSync(testFile, { recursive: true });
  }, AlreadyExists);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test({
  name:
    "mkdir() throws with AlreadyExists when creating a directory on symlinks",
  ignore: platform() === "win32",
  fn: () => {
    const tempDirPath = makeTempDirSync({ prefix: "mkdirSync_" });
    const testDir = join(tempDirPath, "dir");
    const noFile = join(tempDirPath, "nonexistent");
    const testDirLink = join(tempDirPath, "testDirLink");
    const noFileLink = join(tempDirPath, "noFileSymlink");

    mkdirSync(testDir);
    symlinkSync(testDir, testDirLink);
    symlinkSync(noFile, noFileLink);

    assertThrows(() => {
      mkdirSync(noFileLink);
    }, AlreadyExists);

    assertThrows(() => {
      mkdirSync(testDirLink);
    }, AlreadyExists);

    rmSync(tempDirPath, { recursive: true, force: true });
  },
});
