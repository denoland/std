// Copyright 2018-2025 the Deno authors. MIT license.

import {
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { resolve } from "@std/path";
import { chmod, chmodSync } from "./unstable_chmod.ts";
import { NotFound } from "./unstable_errors.js";

Deno.test({
  name: "chmod() sets read only permission bits on regular files",
  ignore: Deno.build.os === "windows",
  fn: async () => {
    const tempDirPath = await Deno.makeTempDir({ prefix: "chmod_" });
    const testFile = resolve(tempDirPath, "chmod_file.txt");
    using _tempFile = await Deno.create(testFile);

    // Check initial testFile permissions are 0o644 (-rw-r--r--).
    const fileStatBefore = await Deno.stat(testFile);
    assertExists(fileStatBefore.mode, "mode property is null");
    assertEquals(fileStatBefore.mode & 0o644, 0o644);

    // Set testFile permission bits to read only, 0o444 (-r--r--r--).
    await chmod(testFile, 0o444);
    const fileStatAfter = await Deno.stat(testFile);
    assertExists(fileStatAfter.mode, "mode property is null");
    assertEquals(fileStatAfter.mode & 0o444, 0o444);

    await Deno.remove(tempDirPath, { recursive: true });
  },
});

Deno.test({
  name: "chmod() sets read only permission bits on a directory",
  ignore: Deno.build.os === "windows",
  fn: async () => {
    const tempDirPath = await Deno.makeTempDir({ prefix: "chmod_" });
    const testDir = resolve(tempDirPath, "testDir");
    await Deno.mkdir(testDir);

    // Check initial testDir permissions are 0o755 (drwxr-xr-x).
    const dirStatBefore = await Deno.stat(testDir);
    assertExists(dirStatBefore.mode, "mode property is null");
    assertEquals(dirStatBefore.mode & 0o755, 0o755);

    // Set testDir permission bits to read only to 0o444 (dr--r--r--).
    await chmod(testDir, 0o444);
    const dirStatAfter = await Deno.stat(testDir);
    assertExists(dirStatAfter.mode, "mode property is null");
    assertEquals(dirStatAfter.mode & 0o444, 0o444);

    await Deno.remove(tempDirPath, { recursive: true });
  },
});

Deno.test({
  name: "chmod() sets write only permission bits of regular file via symlink",
  ignore: Deno.build.os === "windows",
  fn: async () => {
    const tempDirPath = await Deno.makeTempDir({ prefix: "chmod_" });
    const testFile = resolve(tempDirPath, "chmod_file.txt");
    const testSymlink = resolve(tempDirPath, "chmod_file.txt.link");

    using _tempFile = await Deno.create(testFile);
    await Deno.symlink(testFile, testSymlink);

    // Check initial testFile permission bits are 0o644 (-rw-r-xr-x) reading through testSymlink.
    const symlinkStatBefore = await Deno.stat(testSymlink);
    assertExists(symlinkStatBefore.mode, "mode property via symlink is null");
    assertEquals(symlinkStatBefore.mode & 0o644, 0o644);

    // Set write only permission bits of testFile through testSymlink to 0o222 (--w--w--w-).
    await chmod(testSymlink, 0o222);
    const symlinkStatAfter = await Deno.stat(testSymlink);
    assertExists(symlinkStatAfter.mode, "mode property via symlink is null");
    const fileStatAfter = await Deno.stat(testFile);
    assertExists(fileStatAfter.mode, "mode property via file is null");

    // Check if both regular file mode and the mode read through symlink are both write only.
    assertEquals(symlinkStatAfter.mode, fileStatAfter.mode);

    await Deno.remove(tempDirPath, { recursive: true });
  },
});

Deno.test("chmod() rejects with NotFound for a non-existent file", async () => {
  await assertRejects(async () => {
    await chmod("non_existent_file.txt", 0o644);
  }, NotFound);
});

Deno.test({
  name: "chmodSync() sets read-only permission bits on regular files",
  ignore: Deno.build.os === "windows",
  fn: () => {
    const tempDirPath = Deno.makeTempDirSync({ prefix: "chmodSync_" });
    const testFile = resolve(tempDirPath, "chmod_file.txt");
    using _tempFile = Deno.createSync(testFile);

    // Check initial testFile permissions are 0o644 (-rw-r--r--).
    const fileStatBefore = Deno.statSync(testFile);
    assertExists(fileStatBefore.mode, "mode property is null");
    assertEquals(fileStatBefore.mode & 0o644, 0o644);

    // Set testFile permission bits to read only, 0o444 (-r--r--r--).
    chmodSync(testFile, 0o444);
    const fileStatAfter = Deno.statSync(testFile);
    assertExists(fileStatAfter.mode, "mode property is null");
    assertEquals(fileStatAfter.mode & 0o444, 0o444);

    Deno.removeSync(tempDirPath, { recursive: true });
  },
});

Deno.test({
  name: "chmodSync() sets read-only permissions bits on directories",
  ignore: Deno.build.os === "windows",
  fn: () => {
    const tempDirPath = Deno.makeTempDirSync({ prefix: "chmodSync_" });
    const testDir = resolve(tempDirPath, "testDir");
    Deno.mkdirSync(testDir);

    // Check initial testDir permissions are 0o755 (drwxr-xr-x).
    const dirStatBefore = Deno.statSync(testDir);
    assertExists(dirStatBefore.mode, "mode property is null");
    assertEquals(dirStatBefore.mode & 0o755, 0o755);

    // Set testDir permission bits to read only to 0o444 (dr--r--r--).
    chmodSync(testDir, 0o444);
    const dirStatAfter = Deno.statSync(testDir);
    assertExists(dirStatAfter.mode, "mode property is null");
    assertEquals(dirStatAfter.mode & 0o444, 0o444);

    Deno.removeSync(tempDirPath, { recursive: true });
  },
});

Deno.test({
  name: "chmodSync() sets write only permission on a regular file via symlink",
  ignore: Deno.build.os === "windows",
  fn: () => {
    const tempDirPath = Deno.makeTempDirSync({ prefix: "chmodSync_" });
    const testFile = resolve(tempDirPath, "chmod_file.txt");
    const testSymlink = resolve(tempDirPath, "chmod_file.txt.link");

    using _tempFile = Deno.createSync(testFile);
    Deno.symlinkSync(testFile, testSymlink);

    // Check initial testFile permission bits are 0o644 (-rw-r-xr-x) reading through testSymlink.
    const symlinkStatBefore = Deno.statSync(testSymlink);
    assertExists(symlinkStatBefore.mode, "mode property via symlink is null");
    assertEquals(symlinkStatBefore.mode & 0o644, 0o644);

    // Set write only permission bits of testFile through testSymlink to 0o222 (--w--w--w-).
    chmodSync(testSymlink, 0o222);
    const symlinkStatAfter = Deno.statSync(testSymlink);
    assertExists(symlinkStatAfter.mode, "mode property via symlink is null");
    const fileStatAfter = Deno.statSync(testFile);
    assertExists(fileStatAfter.mode, "mode property via file is null");

    // Check if both regular file mode and the mode read through symlink are both write only.
    assertEquals(symlinkStatAfter.mode, fileStatAfter.mode);

    Deno.removeSync(tempDirPath, { recursive: true });
  },
});

Deno.test("chmodSync() throws with NotFound for a non-existent file", () => {
  assertThrows(() => {
    chmodSync("non_existent_file.txt", 0o644);
  }, NotFound);
});
