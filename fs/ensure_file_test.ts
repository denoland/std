// Copyright 2018-2026 the Deno authors. MIT license.
import { assertRejects, assertThrows } from "@std/assert";
import * as path from "@std/path";
import { ensureFile, ensureFileSync } from "./ensure_file.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("ensureFile() creates file if it does not exist", async function () {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_file_",
  });
  const testDir = path.join(tempDirPath, "ensure_file_1");
  const testFile = path.join(testDir, "test.txt");

  try {
    await ensureFile(testFile);

    // test file should exists.
    await Deno.stat(testFile);
  } finally {
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("ensureFileSync() creates file if it does not exist", function () {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_ensure_file_sync_",
  });
  const testDir = path.join(tempDirPath, "ensure_file_2");
  const testFile = path.join(testDir, "test.txt");

  try {
    ensureFileSync(testFile);

    // test file should exists.
    Deno.statSync(testFile);
  } finally {
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("ensureFile() ensures existing file exists", async function () {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_file_",
  });
  const testDir = path.join(tempDirPath, "ensure_file_3");
  const testFile = path.join(testDir, "test.txt");

  try {
    await Deno.mkdir(testDir, { recursive: true });
    await Deno.writeFile(testFile, new Uint8Array());

    await ensureFile(testFile);

    // test file should exists.
    await Deno.stat(testFile);
  } finally {
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("ensureFileSync() ensures existing file exists", function () {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_ensure_file_sync_",
  });
  const testDir = path.join(tempDirPath, "ensure_file_4");
  const testFile = path.join(testDir, "test.txt");

  try {
    Deno.mkdirSync(testDir, { recursive: true });
    Deno.writeFileSync(testFile, new Uint8Array());

    ensureFileSync(testFile);

    // test file should exists.
    Deno.statSync(testFile);
  } finally {
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("ensureFile() rejects if input is dir", async function () {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_file_",
  });
  const testDir = path.join(tempDirPath, "ensure_file_5");

  try {
    await Deno.mkdir(testDir, { recursive: true });

    await assertRejects(
      async () => {
        await ensureFile(testDir);
      },
      Error,
      `Failed to ensure file exists: expected 'file', got 'dir'`,
    );
  } finally {
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("ensureFileSync() throws if input is dir", function () {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_ensure_file_sync_",
  });
  const testDir = path.join(tempDirPath, "ensure_file_6");

  try {
    Deno.mkdirSync(testDir, { recursive: true });

    assertThrows(
      () => {
        ensureFileSync(testDir);
      },
      Error,
      `Failed to ensure file exists: expected 'file', got 'dir'`,
    );
  } finally {
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test({
  name: "ensureFile() rejects permission fs write error",
  permissions: { read: true },
  async fn() {
    const testDir = path.join(testdataDir, "ensure_file_7");
    const testFile = path.join(testDir, "test.txt");

    // ensureFile fails because this test doesn't have write permissions,
    // but don't swallow that error.
    await assertRejects(
      async () => await ensureFile(testFile),
      // deno-lint-ignore no-explicit-any
      (Deno as any).errors.NotCapable ?? Deno.errors.PermissionDenied,
    );
  },
});

Deno.test({
  name: "ensureFileSync() throws permission fs write error",
  permissions: { read: true },
  fn() {
    const testDir = path.join(testdataDir, "ensure_file_8");
    const testFile = path.join(testDir, "test.txt");

    // ensureFileSync fails because this test doesn't have write permissions,
    // but don't swallow that error.
    assertThrows(
      () => ensureFileSync(testFile),
      // deno-lint-ignore no-explicit-any
      (Deno as any).errors.NotCapable ?? Deno.errors.PermissionDenied,
    );
  },
});

Deno.test({
  name:
    "ensureFile() can write file without write permissions on parent directory",
  permissions: {
    read: true,
    write: true,
    run: [Deno.execPath()],
  },
  async fn() {
    const tempDirPath = await Deno.makeTempDir({
      prefix: "deno_std_ensure_file_",
    });
    const testDir = path.join(tempDirPath, "ensure_file_9");
    const testFile = path.join(testDir, "test.txt");

    try {
      await Deno.mkdir(testDir, { recursive: true });
      await Deno.permissions.revoke({ name: "write", path: testDir });

      // should still work as the parent directory already exists
      await ensureFile(testFile);

      // test file should exist
      await Deno.stat(testFile);
    } finally {
      // it's dirty, but we can't remove the test output in the same process after dropping the write permission
      await new Deno.Command(Deno.execPath(), {
        args: [
          "eval",
          "--no-lock",
          `Deno.removeSync("${testDir}", { recursive: true });`,
        ],
      }).output();
      await Deno.remove(tempDirPath, { recursive: true });
    }
  },
});

Deno.test({
  name:
    "ensureFileSync() can write file without write permissions on parent directory",
  permissions: {
    read: true,
    write: true,
    run: [Deno.execPath()],
  },
  fn() {
    const tempDirPath = Deno.makeTempDirSync({
      prefix: "deno_std_ensure_file_sync_",
    });
    const testDir = path.join(tempDirPath, "ensure_file_10");
    const testFile = path.join(testDir, "test.txt");

    try {
      Deno.mkdirSync(testDir, { recursive: true });
      Deno.permissions.revokeSync({ name: "write", path: testDir });

      // should still work as the parent directory already exists
      ensureFileSync(testFile);

      // test file should exist
      Deno.statSync(testFile);
    } finally {
      // it's dirty, but we can't remove the test output in the same process after dropping the write permission
      new Deno.Command(Deno.execPath(), {
        args: [
          "eval",
          "--no-lock",
          `Deno.removeSync("${testDir}", { recursive: true });`,
        ],
      }).outputSync();
      Deno.removeSync(tempDirPath, { recursive: true });
    }
  },
});
