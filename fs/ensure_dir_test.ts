// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import * as path from "@std/path";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { ensureFile, ensureFileSync } from "./ensure_file.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata", "ensure_dir");

Deno.test("ensureDir() creates dir if it does not exist", async function () {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_dir_",
  });
  const baseDir = path.join(tempDirPath, "not_exist");
  const testDir = path.join(baseDir, "test");

  try {
    await ensureDir(testDir);

    // test dir should exists.
    await Deno.stat(testDir);
  } finally {
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("ensureDirSync() creates dir if it does not exist", function () {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_ensure_dir_sync_",
  });
  const baseDir = path.join(tempDirPath, "sync_not_exist");
  const testDir = path.join(baseDir, "test");

  try {
    ensureDirSync(testDir);

    // test dir should exists.
    Deno.statSync(testDir);
  } finally {
    Deno.removeSync(baseDir, { recursive: true });
  }
});

Deno.test("ensureDir() ensures existing dir exists", async function () {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_dir_",
  });
  const baseDir = path.join(tempDirPath, "exist");
  const testDir = path.join(baseDir, "test");

  try {
    // create test directory
    await Deno.mkdir(testDir, { recursive: true });

    await ensureDir(testDir);

    // test dir should still exists.
    await Deno.stat(testDir);
  } finally {
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("ensureDirSync() ensures existing dir exists", function () {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_ensure_dir_sync_",
  });
  const baseDir = path.join(tempDirPath, "sync_exist");
  const testDir = path.join(baseDir, "test");

  try {
    // create test directory
    Deno.mkdirSync(testDir, { recursive: true });

    ensureDirSync(testDir);

    // test dir should still exists.
    Deno.statSync(testDir);
  } finally {
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("ensureDir() accepts links to dirs", async function () {
  const ldir = path.join(testdataDir, "ldir");

  await ensureDir(ldir);

  // test dir should still exists.
  await Deno.stat(ldir);
  // ldir should be still be a symlink
  const { isSymlink } = await Deno.lstat(ldir);
  assertEquals(isSymlink, true);
});

Deno.test("ensureDirSync() accepts links to dirs", function () {
  const ldir = path.join(testdataDir, "ldir");

  ensureDirSync(ldir);

  // test dir should still exists.
  Deno.statSync(ldir);
  // ldir should be still be a symlink
  const { isSymlink } = Deno.lstatSync(ldir);
  assertEquals(isSymlink, true);
});

Deno.test("ensureDir() rejects if input is a file", async function () {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_dir_",
  });
  const baseDir = path.join(tempDirPath, "exist_file");
  const testFile = path.join(baseDir, "test");

  try {
    await ensureFile(testFile);

    await assertRejects(
      async () => {
        await ensureDir(testFile);
      },
      Error,
      `Failed to ensure directory exists: expected 'dir', got 'file'`,
    );
  } finally {
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("ensureDirSync() throws if input is a file", function () {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_ensure_dir_sync_",
  });
  const baseDir = path.join(tempDirPath, "exist_file_sync");
  const testFile = path.join(baseDir, "test");

  try {
    ensureFileSync(testFile);

    assertThrows(
      () => {
        ensureDirSync(testFile);
      },
      Error,
      `Failed to ensure directory exists: expected 'dir', got 'file'`,
    );
  } finally {
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("ensureDir() rejects links to files", async function () {
  const lf = path.join(testdataDir, "lf");

  await assertRejects(
    async () => {
      await ensureDir(lf);
    },
    Error,
    `Failed to ensure directory exists: expected 'dir', got 'file'`,
  );
});

Deno.test("ensureDirSync() rejects links to files", function () {
  const lf = path.join(testdataDir, "lf");

  assertThrows(
    () => {
      ensureDirSync(lf);
    },
    Error,
    `Failed to ensure directory exists: expected 'dir', got 'file'`,
  );
});

Deno.test({
  name: "ensureDir() rejects permission fs write error",
  permissions: { read: true },
  async fn() {
    const baseDir = path.join(testdataDir, "without_permission");

    // ensureDir fails because this test doesn't have write permissions,
    // but don't swallow that error.
    await assertRejects(
      async () => await ensureDir(baseDir),
      // deno-lint-ignore no-explicit-any
      (Deno as any).errors.NotCapable ?? Deno.errors.PermissionDenied,
    );
  },
});

Deno.test({
  name: "ensureDirSync() throws permission fs write error",
  permissions: { read: true },
  fn() {
    const baseDir = path.join(
      testdataDir,
      "sync_without_permission",
    );

    // ensureDirSync fails because this test doesn't have write permissions,
    // but don't swallow that error.
    assertThrows(
      () => ensureDirSync(baseDir),
      // deno-lint-ignore no-explicit-any
      (Deno as any).errors.NotCapable ?? Deno.errors.PermissionDenied,
    );
  },
});

Deno.test({
  name: "ensureDir() isn't racy",
  async fn() {
    for (const _ of Array(100)) {
      const dir = path.join(
        await Deno.makeTempDir(),
        "check",
        "race",
      );

      // It doesn't throw with successive calls.
      await Promise.all([
        ensureDir(dir),
        ensureDir(dir),
      ]);
    }
  },
});
