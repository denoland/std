// Copyright 2018-2026 the Deno authors. MIT license.
// TODO(axetroy): Add test for Windows once symlink is implemented for Windows.
import {
  assert,
  assertEquals,
  assertMatch,
  assertRejects,
  assertThrows,
} from "@std/assert";
import * as path from "@std/path";
import { ensureSymlink, ensureSymlinkSync } from "./ensure_symlink.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("ensureSymlink() rejects if file does not exist", async function () {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_symlink_",
  });
  const testDir = path.join(tempDirPath, "link_file_1");
  const testFile = path.join(testDir, "test.txt");

  await assertRejects(
    async () => {
      await ensureSymlink(testFile, path.join(testDir, "test1.txt"));
    },
  );

  await assertRejects(
    async () => {
      await Deno.stat(testFile).then(() => {
        throw new Error("test file should exist.");
      });
    },
  );

  await Deno.remove(tempDirPath, { recursive: true });
});

Deno.test("ensureSymlinkSync() throws if file does not exist", function () {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_ensure_symlink_sync_",
  });
  const testDir = path.join(tempDirPath, "link_file_2");
  const testFile = path.join(testDir, "test.txt");

  assertThrows(() => {
    ensureSymlinkSync(testFile, path.join(testDir, "test1.txt"));
  });

  assertThrows(() => {
    Deno.statSync(testFile);
    throw new Error("test file should exist.");
  });

  Deno.removeSync(tempDirPath, { recursive: true });
});

Deno.test("ensureSymlink() ensures linkName links to target", async function () {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_symlink_",
  });
  const testDir = path.join(tempDirPath, "link_file_3");
  const testFile = path.join(testDir, "test.txt");
  const linkFile = path.join(testDir, "link.txt");

  await Deno.mkdir(testDir, { recursive: true });
  await Deno.writeFile(testFile, new Uint8Array());

  await ensureSymlink(testFile, linkFile);
  await ensureSymlink(testFile, linkFile);

  const srcStat = await Deno.lstat(testFile);
  const linkStat = await Deno.lstat(linkFile);

  assertEquals(srcStat.isFile, true);
  assertEquals(linkStat.isSymlink, true);

  await Deno.remove(tempDirPath, { recursive: true });
});

Deno.test("ensureSymlinkSync() ensures linkName links to target", function () {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_ensure_symlink_sync_",
  });
  const testDir = path.join(tempDirPath, "link_file_4");
  const testFile = path.join(testDir, "test.txt");
  const linkFile = path.join(testDir, "link.txt");

  Deno.mkdirSync(testDir, { recursive: true });
  Deno.writeFileSync(testFile, new Uint8Array());

  ensureSymlinkSync(testFile, linkFile);
  ensureSymlinkSync(testFile, linkFile);

  const srcStat = Deno.lstatSync(testFile);
  const linkStat = Deno.lstatSync(linkFile);

  assertEquals(srcStat.isFile, true);
  assertEquals(linkStat.isSymlink, true);

  Deno.removeSync(tempDirPath, { recursive: true });
});

Deno.test("ensureSymlink() rejects if the linkName path already exist", async function () {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_symlink_",
  });
  const testDir = path.join(tempDirPath, "link_file_5");
  const linkFile = path.join(testDir, "test.txt");
  const linkDir = path.join(testDir, "test_dir");
  const linkSymlink = path.join(testDir, "test_symlink");
  const targetFile = path.join(testDir, "target.txt");

  await Deno.mkdir(testDir, { recursive: true });
  await Deno.writeTextFile(linkFile, "linkFile");
  await Deno.mkdir(linkDir);
  await Deno.symlink("non-existent", linkSymlink, { type: "file" });
  await Deno.writeTextFile(targetFile, "targetFile");

  await assertRejects(
    async () => {
      await ensureSymlink(targetFile, linkFile);
    },
  );
  await assertRejects(
    async () => {
      await ensureSymlink(targetFile, linkDir);
    },
  );
  await assertRejects(
    async () => {
      await ensureSymlink(targetFile, linkSymlink);
    },
  );

  assertEquals(await Deno.readTextFile(linkFile), "linkFile");
  assertEquals((await Deno.stat(linkDir)).isDirectory, true);
  assertEquals(await Deno.readLink(linkSymlink), "non-existent");
  assertEquals(await Deno.readTextFile(targetFile), "targetFile");

  await Deno.remove(tempDirPath, { recursive: true });
});

Deno.test("ensureSymlinkSync() throws if the linkName path already exist", function () {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_ensure_symlink_sync_",
  });
  const testDir = path.join(tempDirPath, "link_file_6");
  const linkFile = path.join(testDir, "test.txt");
  const linkDir = path.join(testDir, "test_dir");
  const linkSymlink = path.join(testDir, "test_symlink");
  const targetFile = path.join(testDir, "target.txt");

  Deno.mkdirSync(testDir, { recursive: true });
  Deno.writeTextFileSync(linkFile, "linkFile");
  Deno.mkdirSync(linkDir);
  Deno.symlinkSync("non-existent", linkSymlink, { type: "file" });
  Deno.writeTextFileSync(targetFile, "targetFile");

  assertThrows(() => {
    ensureSymlinkSync(targetFile, linkFile);
  });
  assertThrows(() => {
    ensureSymlinkSync(targetFile, linkDir);
  });
  assertThrows(() => {
    ensureSymlinkSync(targetFile, linkSymlink);
  });

  assertEquals(Deno.readTextFileSync(linkFile), "linkFile");
  assertEquals(Deno.statSync(linkDir).isDirectory, true);
  assertEquals(Deno.readLinkSync(linkSymlink), "non-existent");
  assertEquals(Deno.readTextFileSync(targetFile), "targetFile");

  Deno.removeSync(tempDirPath, { recursive: true });
});

Deno.test("ensureSymlink() ensures dir linkName links to dir target", async function () {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_symlink_",
  });
  const testDir = path.join(tempDirPath, "link_file_origin_3");
  const linkDir = path.join(tempDirPath, "link_file_link_3");
  const testFile = path.join(testDir, "test.txt");

  await Deno.mkdir(testDir, { recursive: true });
  await Deno.writeFile(testFile, new Uint8Array());

  await ensureSymlink(testDir, linkDir);
  await ensureSymlink(testDir, linkDir);

  const testDirStat = await Deno.lstat(testDir);
  const linkDirStat = await Deno.lstat(linkDir);
  const testFileStat = await Deno.lstat(testFile);

  assertEquals(testFileStat.isFile, true);
  assertEquals(testDirStat.isDirectory, true);
  assertEquals(linkDirStat.isSymlink, true);

  await Deno.remove(tempDirPath, { recursive: true });
});

Deno.test("ensureSymlinkSync() ensures dir linkName links to dir target", function () {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_ensure_symlink_sync_",
  });
  const testDir = path.join(tempDirPath, "link_file_origin_3");
  const linkDir = path.join(tempDirPath, "link_file_link_3");
  const testFile = path.join(testDir, "test.txt");

  Deno.mkdirSync(testDir, { recursive: true });
  Deno.writeFileSync(testFile, new Uint8Array());

  ensureSymlinkSync(testDir, linkDir);
  ensureSymlinkSync(testDir, linkDir);

  const testDirStat = Deno.lstatSync(testDir);
  const linkDirStat = Deno.lstatSync(linkDir);
  const testFileStat = Deno.lstatSync(testFile);

  assertEquals(testFileStat.isFile, true);
  assertEquals(testDirStat.isDirectory, true);
  assertEquals(linkDirStat.isSymlink, true);

  Deno.removeSync(tempDirPath, { recursive: true });
});

Deno.test("ensureSymlink() creates symlink with relative target", async function () {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_symlink_",
  });
  const testDir = path.join(tempDirPath, "symlink-relative");
  const testLinkName = path.join(testDir, "link.txt");
  const testFile = path.join(testDir, "target.txt");

  await Deno.mkdir(testDir);

  await Deno.writeFile(testFile, new Uint8Array());

  await ensureSymlink("target.txt", testLinkName);

  const testDirStat = await Deno.lstat(testDir);
  const linkDirStat = await Deno.lstat(testLinkName);
  const testFileStat = await Deno.lstat(testFile);

  assertEquals(testFileStat.isFile, true);
  assertEquals(testDirStat.isDirectory, true);
  assertEquals(linkDirStat.isSymlink, true);

  await Deno.remove(tempDirPath, { recursive: true });
});

Deno.test("ensureSymlinkSync() creates symlink with relative target", function () {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_ensure_symlink_sync_",
  });
  const testDir = path.join(tempDirPath, "symlink-relative-sync");
  const testLinkName = path.join(testDir, "link.txt");
  const testFile = path.join(testDir, "target.txt");

  Deno.mkdirSync(testDir);

  Deno.writeFileSync(testFile, new Uint8Array());

  ensureSymlinkSync("target.txt", testLinkName);

  const testDirStat = Deno.lstatSync(testDir);
  const linkDirStat = Deno.lstatSync(testLinkName);
  const testFileStat = Deno.lstatSync(testFile);

  assertEquals(testFileStat.isFile, true);
  assertEquals(testDirStat.isDirectory, true);
  assertEquals(linkDirStat.isSymlink, true);

  Deno.removeSync(tempDirPath, { recursive: true });
});

Deno.test("ensureSymlink() rejects when the target path doesn't exist", async () => {
  const e = await assertRejects(
    async () => {
      await ensureSymlink("non-existent-target", "non-existent-link");
    },
    Deno.errors.NotFound,
  );
  assertMatch(
    e.message,
    /^Cannot ensure symlink as the target path does not exist: .*non-existent-target$/,
  );
});

Deno.test("ensureSymlinkSync() throws when the target path doesn't exist", () => {
  const e = assertThrows(() => {
    ensureSymlinkSync("non-existent-target", "non-existent-link");
  }, Deno.errors.NotFound);
  assertMatch(
    e.message,
    /^Cannot ensure symlink as the target path does not exist: .*non-existent-target$/,
  );
});

Deno.test("ensureSymlink() works with URLs", {
  // TODO(kt3k): The 2nd test case doesn't pass on Windows. Fix it.
  ignore: Deno.build.os === "windows",
}, async () => {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_ensure_symlink_",
  });
  const testDir = path.join(tempDirPath, "link_file_with_url");
  const testFile = path.join(testDir, "test.txt");
  const linkFile = path.join(testDir, "link.txt");
  {
    try {
      await Deno.mkdir(testDir, { recursive: true });
      await Deno.writeFile(testFile, new Uint8Array());

      await ensureSymlink(path.toFileUrl(testFile), path.toFileUrl(linkFile));

      const srcStat = await Deno.lstat(testFile);
      const linkStat = await Deno.lstat(linkFile);

      assert(srcStat.isFile);
      assert(linkStat.isSymlink);
    } finally {
      await Deno.remove(testDir, { recursive: true });
    }
  }

  {
    try {
      await Deno.mkdir(testDir, { recursive: true });
      await Deno.writeFile(testFile, new Uint8Array());

      await ensureSymlink(testFile, path.toFileUrl(linkFile));

      const srcStat = await Deno.lstat(testFile);
      const linkStat = await Deno.lstat(linkFile);

      assert(srcStat.isFile);
      assert(linkStat.isSymlink);
    } finally {
      await Deno.remove(testDir, { recursive: true });
    }
  }
  await Deno.remove(tempDirPath, { recursive: true });
});

Deno.test(
  "ensureSymlink() rejects with permission error if it doesn't have write permission",
  { permissions: { read: true } },
  async () => {
    const testFile = path.join(testdataDir, "0.ts");
    const linkFile = path.join(testdataDir, "link.ts");

    await assertRejects(
      async () => {
        await ensureSymlink(testFile, linkFile);
      },
      // deno-lint-ignore no-explicit-any
      (Deno as any).errors.NotCapable ?? Deno.errors.PermissionDenied,
    );
  },
);

Deno.test(
  "ensureSymlinkSync() throws permission error if it doesn't have write permission",
  { permissions: { read: true } },
  () => {
    const testFile = path.join(testdataDir, "0.ts");
    const linkFile = path.join(testdataDir, "link.ts");

    assertThrows(
      () => {
        ensureSymlinkSync(testFile, linkFile);
      },
      // deno-lint-ignore no-explicit-any
      (Deno as any).errors.NotCapable ?? Deno.errors.PermissionDenied,
    );
  },
);
