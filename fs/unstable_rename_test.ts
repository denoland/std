// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertRejects, assertThrows } from "@std/assert";
import { lessOrEqual, parse as parseSemver } from "@std/semver";
import { rename, renameSync } from "./unstable_rename.ts";
import { NotFound } from "./unstable_errors.js";
import { mkdir, mkdtemp, open, rm, stat, symlink } from "node:fs/promises";
import { platform, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  closeSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  rmSync,
  statSync,
  symlinkSync,
} from "node:fs";

// In Deno 2.2.2 or earlier, the `rename` function has an issue on Windows.
const RENAME_HAS_ISSUE = Deno.version &&
  parseSemver(Deno.version.deno).build?.length === 0 && // not canary
  lessOrEqual(parseSemver(Deno.version.deno), parseSemver("2.2.2")) &&
  platform() === "win32";

/** Tests if the original file/directory is missing since the file is renamed.
 * Uses Node.js Error instances to check because the `lstatSync` function is
 * pulled in from the `node:fs` package without using `mapError`. */
function assertMissing(path: string) {
  let caughtErr = false;
  let info;
  try {
    info = lstatSync(path);
  } catch (error) {
    caughtErr = true;
    // Check if the error caught is a Node.js error instance.
    if (error instanceof Error && "code" in error) {
      assert(error.code === "ENOENT", "errno code is not ENOENT.");
    }
  }
  assert(caughtErr);
  assert(info === undefined);
}

Deno.test("rename() renames a regular file", async () => {
  const tempDirPath = await mkdtemp(resolve(tmpdir(), "rename_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const renameFile = join(tempDirPath, "renamedFile.txt");

  const testFh = await open(testFile, "w");
  await testFh.close();

  await rename(testFile, renameFile);
  assertMissing(testFile);
  const renameFileStat = await stat(renameFile);
  assert(renameFileStat.isFile());

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("rename() rejects with Error when an existing regular file is renamed with an existing directory path", async () => {
  const tempDirPath = await mkdtemp(resolve(tmpdir(), "rename_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const testDir = join(tempDirPath, "testDir");

  const tempFh = await open(testFile, "w");
  await tempFh.close();
  await mkdir(testDir);

  await assertRejects(async () => {
    await rename(testFile, testDir);
  }, Error);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("rename() rejects with Error when an existing directory is renamed with an existing directory containing a file", async () => {
  const tempDirPath = await mkdtemp(resolve(tmpdir(), "rename_"));
  const emptyDir = join(tempDirPath, "emptyDir");
  const fullDir = join(tempDirPath, "fullDir");
  const testFile = join(fullDir, "testFile.txt");

  await mkdir(fullDir);
  await mkdir(emptyDir);
  const testFh = await open(testFile, "w");
  await testFh.close();

  await assertRejects(async () => {
    await rename(emptyDir, fullDir);
  }, Error);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test(
  "rename() succeeds when an existing directory is renamed with another directory path",
  { ignore: RENAME_HAS_ISSUE },
  async () => {
    const tempDirPath = await mkdtemp(resolve(tmpdir(), "rename_"));
    const testDir = join(tempDirPath, "testDir");
    const anotherDir = join(tempDirPath, "anotherDir");

    await mkdir(testDir);
    await mkdir(anotherDir);

    await rename(testDir, anotherDir);
    assertMissing(testDir);
    const anotherDirStat = await stat(anotherDir);
    assert(anotherDirStat.isDirectory());

    await rm(tempDirPath, { recursive: true, force: true });
  },
);

Deno.test(
  "rename() rejects with Error when an existing directory is renamed with an existing regular file path",
  // TODO(kt3k): This test should pass on Windows
  { ignore: platform() === "win32" || RENAME_HAS_ISSUE },
  async () => {
    const tempDirPath = await mkdtemp(resolve(tmpdir(), "rename_"));
    const testFile = join(tempDirPath, "testFile.txt");
    const testDir = join(tempDirPath, "testDir");

    const testFh = await open(testFile, "w");
    await testFh.close();
    await mkdir(testDir);

    await assertRejects(async () => {
      await rename(testDir, testFile);
    }, Error);

    await rm(tempDirPath, { recursive: true, force: true });
  },
);

Deno.test({
  name:
    "rename() rejects with Error when renaming an existing directory with a valid symlink'd regular file path",
  ignore: platform() === "win32",
  fn: async () => {
    const tempDirPath = await mkdtemp(resolve(tmpdir(), "rename_"));
    const testDir = join(tempDirPath, "testDir");
    const testFile = join(tempDirPath, "testFile.txt");
    const symlinkFile = join(tempDirPath, "testFile.txt.link");

    await mkdir(testDir);
    const testFh = await open(testFile, "w");
    await testFh.close();
    await symlink(testFile, symlinkFile);

    await assertRejects(async () => {
      await rename(testDir, symlinkFile);
    }, Error);

    await rm(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test({
  name:
    "rename() rejects with Error when renaming an existing directory with a valid symlink'd directory path",
  ignore: platform() === "win32",
  fn: async () => {
    const tempDirPath = await mkdtemp(resolve(tmpdir(), "rename_"));
    const testDir = join(tempDirPath, "testDir");
    const anotherDir = join(tempDirPath, "anotherDir");
    const symlinkDir = join(tempDirPath, "symlinkDir");

    await mkdir(testDir);
    await mkdir(anotherDir);
    await symlink(anotherDir, symlinkDir);

    await assertRejects(async () => {
      await rename(testDir, symlinkDir);
    }, Error);

    await rm(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test({
  name:
    "rename() rejects with Error when renaming an existing directory with a symlink'd file pointing to a non-existent file path",
  ignore: platform() === "win32",
  fn: async () => {
    const tempDirPath = await mkdtemp(resolve(tmpdir(), "rename_"));
    const testDir = join(tempDirPath, "testDir");
    const symlinkPath = join(tempDirPath, "symlinkPath");

    await mkdir(testDir);
    await symlink("non-existent", symlinkPath);

    await assertRejects(async () => {
      await rename(testDir, symlinkPath);
    }, Error);

    await rm(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test("rename() rejects with NotFound for renaming a non-existent file", async () => {
  await assertRejects(async () => {
    await rename("non-existent-file.txt", "new-name.txt");
  }, NotFound);
});

Deno.test("renameSync() renames a regular file", () => {
  const tempDirPath = mkdtempSync(resolve(tmpdir(), "renameSync_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const renameFile = join(tempDirPath, "renamedFile.txt");

  const testFd = openSync(testFile, "w");
  closeSync(testFd);

  renameSync(testFile, renameFile);
  assertMissing(testFile);
  const renameFileStat = statSync(renameFile);
  assert(renameFileStat.isFile);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("renameSync() throws with Error when an existing regular file is renamed with an existing directory path", () => {
  const tempDirPath = mkdtempSync(resolve(tmpdir(), "renameSync_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const testDir = join(tempDirPath, "testDir");

  const testFd = openSync(testFile, "w");
  closeSync(testFd);
  mkdirSync(testDir);

  assertThrows(() => {
    renameSync(testFile, testDir);
  }, Error);
});

Deno.test("renameSync() throws with Error when an existing file path is renamed with an existing directory path", () => {
  const tempDirPath = mkdtempSync(resolve(tmpdir(), "renameSync_"));
  const testFile = join(tempDirPath, "testFile.txt");
  const testDir = join(tempDirPath, "testDir");

  const testFd = openSync(testFile, "w");
  closeSync(testFd);
  mkdirSync(testDir);

  assertThrows(() => {
    renameSync(testFile, testDir);
  }, Error);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test(
  "renameSync() throws with Error when an existing directory is renamed with an existing directory containing a file",
  { ignore: RENAME_HAS_ISSUE },
  () => {
    const tempDirPath = mkdtempSync(resolve(tmpdir(), "renameSync_"));
    const emptyDir = join(tempDirPath, "emptyDir");
    const fullDir = join(tempDirPath, "fullDir");
    const testFile = join(fullDir, "testFile.txt");

    mkdirSync(fullDir);
    mkdirSync(emptyDir);
    const testFd = openSync(testFile, "w");
    closeSync(testFd);

    assertThrows(() => {
      renameSync(emptyDir, fullDir);
    }, Error);

    rmSync(tempDirPath, { recursive: true, force: true });
  },
);

Deno.test(
  "renameSync() succeeds when an existing directory is renamed with another directory path",
  { ignore: RENAME_HAS_ISSUE },
  () => {
    const tempDirPath = mkdtempSync(resolve(tmpdir(), "renameSync_"));
    const testDir = join(tempDirPath, "testDir");
    const anotherDir = join(tempDirPath, "anotherDir");

    mkdirSync(testDir);
    mkdirSync(anotherDir);

    renameSync(testDir, anotherDir);
    assertMissing(testDir);
    const anotherDirStat = statSync(anotherDir);
    assert(anotherDirStat.isDirectory());

    rmSync(tempDirPath, { recursive: true, force: true });
  },
);

Deno.test(
  "renameSync() throws with Error when an existing directory is renamed with an existing regular file path",
  // TODO(kt3k): This test should pass on Windows
  { ignore: platform() === "win32" || RENAME_HAS_ISSUE },
  () => {
    const tempDirPath = mkdtempSync(resolve(tmpdir(), "renameSync_"));
    const testFile = join(tempDirPath, "testFile.txt");
    const testDir = join(tempDirPath, "testDir");

    const testFd = openSync(testFile, "w");
    closeSync(testFd);
    mkdirSync(testDir);

    assertThrows(() => {
      renameSync(testDir, testFile);
    }, Error);

    rmSync(tempDirPath, { recursive: true, force: true });
  },
);

Deno.test({
  name:
    "renameSync() throws with Error when renaming an existing directory with a valid symlink'd regular file path",
  ignore: platform() === "win32",
  fn: () => {
    const tempDirPath = mkdtempSync(resolve(tmpdir(), "renameSync_"));
    const testDir = join(tempDirPath, "testDir");
    const testFile = join(tempDirPath, "testFile.txt");
    const symlinkFile = join(tempDirPath, "testFile.txt.link");

    mkdirSync(testDir);
    const testFd = openSync(testFile, "w");
    closeSync(testFd);
    symlinkSync(testFile, symlinkFile);

    assertThrows(() => {
      renameSync(testDir, symlinkFile);
    }, Error);

    rmSync(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test({
  name:
    "renameSync() throws with Error when renaming an existing directory with a valid symlink'd directory path",
  ignore: platform() === "win32",
  fn: () => {
    const tempDirPath = mkdtempSync(resolve(tmpdir(), "renameSync_"));
    const testDir = join(tempDirPath, "testDir");
    const anotherDir = join(tempDirPath, "anotherDir");
    const symlinkDir = join(tempDirPath, "symlinkDir");

    mkdirSync(testDir);
    mkdirSync(anotherDir);
    symlinkSync(anotherDir, symlinkDir);

    assertThrows(() => {
      renameSync(testDir, symlinkDir);
    }, Error);

    rmSync(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test({
  name:
    "rename() rejects with Error when renaming an existing directory with a symlink'd file pointing to a non-existent file path",
  ignore: platform() === "win32",
  fn: () => {
    const tempDirPath = mkdtempSync(resolve(tmpdir(), "renameSync_"));
    const testDir = join(tempDirPath, "testDir");
    const symlinkPath = join(tempDirPath, "symlinkPath");

    mkdirSync(testDir);
    symlinkSync("non-existent", symlinkPath);

    assertThrows(() => {
      renameSync(testDir, symlinkPath);
    }, Error);

    rmSync(tempDirPath, { recursive: true, force: true });
  },
});

Deno.test("renameSync() throws with NotFound for renaming a non-existent file", () => {
  assertThrows(() => {
    renameSync("non-existent-file.txt", "new-name.txt");
  }, NotFound);
});
