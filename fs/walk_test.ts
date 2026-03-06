// Copyright 2018-2026 the Deno authors. MIT license.
import { walk, type WalkOptions, walkSync } from "./walk.ts";
import {
  assertArrayIncludes,
  assertEquals,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { copy, copySync } from "./copy.ts";
import { fromFileUrl, resolve } from "@std/path";

const testdataDir = resolve(fromFileUrl(import.meta.url), "../testdata/walk");

async function assertWalkPaths(
  parentDir: string,
  rootPath: string,
  expectedPaths: string[],
  options?: WalkOptions,
) {
  const root = resolve(parentDir, rootPath);
  const entries = await Array.fromAsync(walk(root, options));

  const expected = expectedPaths.map((path) => resolve(root, path));
  assertEquals(entries.length, expected.length);
  assertArrayIncludes(entries.map(({ path }) => path), expected);
}

function assertWalkSyncPaths(
  parentDir: string,
  rootPath: string,
  expectedPaths: string[],
  options?: WalkOptions,
) {
  const root = resolve(parentDir, rootPath);
  const entriesSync = Array.from(walkSync(root, options));

  const expected = expectedPaths.map((path) => resolve(root, path));
  assertEquals(entriesSync.length, expected.length);
  assertArrayIncludes(entriesSync.map(({ path }) => path), expected);
}

Deno.test("walk() returns current dir for empty dir", async () => {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_walk_",
  });
  const emptyDir = resolve(tempDirPath, "empty_dir");
  await Deno.mkdir(emptyDir);
  await assertWalkPaths(tempDirPath, "empty_dir", ["."]);
  await Deno.remove(tempDirPath, { recursive: true });
});

Deno.test("walkSync() returns current dir for empty dir", () => {
  const tempDirPath = Deno.makeTempDirSync({
    prefix: "deno_std_walk_sync_",
  });
  const emptyDir = resolve(tempDirPath, "empty_dir");
  Deno.mkdirSync(emptyDir);
  assertWalkSyncPaths(tempDirPath, "empty_dir", ["."]);
  Deno.removeSync(tempDirPath, { recursive: true });
});

Deno.test("walk() returns current dir and single file", async () =>
  await assertWalkPaths(testdataDir, "single_file", [".", "x"]));

Deno.test("walkSync() returns current dir and single file", () =>
  assertWalkSyncPaths(testdataDir, "single_file", [".", "x"]));

Deno.test("walk() returns current dir, subdir, and nested file", async () =>
  await assertWalkPaths(testdataDir, "nested_single_file", [".", "a", "a/x"]));

Deno.test("walkSync() returns current dir, subdir, and nested file", () =>
  assertWalkSyncPaths(testdataDir, "nested_single_file", [".", "a", "a/x"]));

Deno.test("walk() accepts maxDepth option", async () =>
  await assertWalkPaths(testdataDir, "depth", [".", "a", "a/b", "a/b/c"], {
    maxDepth: 3,
  }));

Deno.test("walkSync() accepts maxDepth option", () =>
  assertWalkSyncPaths(testdataDir, "depth", [".", "a", "a/b", "a/b/c"], {
    maxDepth: 3,
  }));

Deno.test("walk() accepts includeDirs option set to false", async () =>
  await assertWalkPaths(testdataDir, "depth", ["a/b/c/d/x"], {
    includeDirs: false,
  }));

Deno.test("walkSync() accepts includeDirs option set to false", () =>
  assertWalkSyncPaths(testdataDir, "depth", ["a/b/c/d/x"], {
    includeDirs: false,
  }));

Deno.test("walk() accepts includeFiles option set to false", async () =>
  await assertWalkPaths(testdataDir, "depth", [
    ".",
    "a",
    "a/b",
    "a/b/c",
    "a/b/c/d",
  ], {
    includeFiles: false,
  }));

Deno.test("walkSync() accepts includeFiles option set to false", () =>
  assertWalkSyncPaths(testdataDir, "depth", [
    ".",
    "a",
    "a/b",
    "a/b/c",
    "a/b/c/d",
  ], {
    includeFiles: false,
  }));

Deno.test("walk() accepts ext option as strings", async () =>
  await assertWalkPaths(testdataDir, "ext", ["y.rs", "x.ts"], {
    exts: [".rs", ".ts"],
  }));

Deno.test("walk() accepts ext option as strings (excluding period prefix)", async () =>
  await assertWalkPaths(testdataDir, "ext", ["y.rs", "x.ts"], {
    exts: ["rs", "ts"],
  }));

Deno.test("walkSync() accepts ext option as strings", () =>
  assertWalkSyncPaths(testdataDir, "ext", ["y.rs", "x.ts"], {
    exts: [".rs", ".ts"],
  }));

Deno.test("walkSync() accepts ext option as strings (excluding period prefix)", () =>
  assertWalkSyncPaths(testdataDir, "ext", ["y.rs", "x.ts"], {
    exts: [".rs", ".ts"],
  }));

Deno.test("walk() accepts ext option as regExps", async () =>
  await assertWalkPaths(testdataDir, "match", ["x", "y"], {
    match: [/x/, /y/],
  }));

Deno.test("walkSync() accepts ext option as regExps", () =>
  assertWalkSyncPaths(testdataDir, "match", ["x", "y"], {
    match: [/x/, /y/],
  }));

Deno.test("walk() accepts skip option as regExps", async () =>
  await assertWalkPaths(testdataDir, "match", [".", "z"], {
    skip: [/x/, /y/],
  }));

Deno.test("walkSync() accepts skip option as regExps", () =>
  assertWalkSyncPaths(testdataDir, "match", [".", "z"], {
    skip: [/x/, /y/],
  }));

// https://github.com/denoland/std/issues/1358
Deno.test("walk() accepts followSymlinks option set to true", async () =>
  await assertWalkPaths(testdataDir, "symlink", [
    ".",
    "a",
    "a/z",
    "a",
    "a/z",
    "x",
    "x",
  ], {
    followSymlinks: true,
  }));

Deno.test("walkSync() accepts followSymlinks option set to true", () =>
  assertWalkSyncPaths(testdataDir, "symlink", [
    ".",
    "a",
    "a/z",
    "a",
    "a/z",
    "x",
    "x",
  ], {
    followSymlinks: true,
  }));

Deno.test("walk() accepts followSymlinks option set to true with canonicalize option set to false", async () =>
  await assertWalkPaths(testdataDir, "symlink", [
    ".",
    "a",
    "a/z",
    "b",
    "b/z",
    "x",
    "y",
  ], {
    followSymlinks: true,
    canonicalize: false,
  }));

Deno.test("walkSync() accepts followSymlinks option set to true with canonicalize option set to false", () =>
  assertWalkSyncPaths(testdataDir, "symlink", [
    ".",
    "a",
    "a/z",
    "b",
    "b/z",
    "x",
    "y",
  ], {
    followSymlinks: true,
    canonicalize: false,
  }));

Deno.test("walk() accepts followSymlinks option set to false", async () => {
  await assertWalkPaths(testdataDir, "symlink", [
    ".",
    "a",
    "a/z",
    "b",
    "x",
    "y",
  ], {
    followSymlinks: false,
  });
});

Deno.test("walkSync() accepts followSymlinks option set to false", () => {
  assertWalkSyncPaths(
    testdataDir,
    "symlink",
    [".", "a", "a/z", "b", "x", "y"],
    {
      followSymlinks: false,
    },
  );
});

Deno.test("walk() rejects Deno.errors.NotFound for non-existent root", async () => {
  const root = resolve(testdataDir, "non_existent");
  await assertRejects(
    async () => await Array.fromAsync(walk(root)),
    Deno.errors.NotFound,
  );
});

Deno.test("walkSync() throws Deno.errors.NotFound for non-existent root", () => {
  const root = resolve(testdataDir, "non_existent");
  assertThrows(() => Array.from(walkSync(root)), Deno.errors.NotFound);
});

// https://github.com/denoland/std/issues/1789
Deno.test({
  name: "walk() walks unix socket",
  ignore: Deno.build.os === "windows",
  async fn() {
    const tempDirPath = await Deno.makeTempDir({
      prefix: "deno_std_walk_",
    });
    // Copy contents from "walk/socket" into temporary directory.
    await copy(resolve(testdataDir, "socket"), resolve(tempDirPath, "socket"));
    const path = resolve(tempDirPath, "socket", "a.sock");
    try {
      using _listener = Deno.listen({ path, transport: "unix" });
      await assertWalkPaths(tempDirPath, "socket", [
        ".",
        "a.sock",
        ".gitignore",
      ], {
        followSymlinks: true,
      });
    } finally {
      await Deno.remove(tempDirPath, { recursive: true });
    }
  },
});

// https://github.com/denoland/std/issues/1789
Deno.test({
  name: "walkSync() walks unix socket",
  ignore: Deno.build.os === "windows",
  fn() {
    const tempDirPath = Deno.makeTempDirSync({
      prefix: "deno_std_walk_sync_",
    });
    // Copy contents from "walk/socket" into temporary directory.
    copySync(resolve(testdataDir, "socket"), resolve(tempDirPath, "socket"));
    const path = resolve(tempDirPath, "socket", "a.sock");
    try {
      using _listener = Deno.listen({ path, transport: "unix" });
      assertWalkSyncPaths(
        tempDirPath,
        "socket",
        [".", "a.sock", ".gitignore"],
        {
          followSymlinks: true,
        },
      );
    } finally {
      Deno.removeSync(tempDirPath, { recursive: true });
    }
  },
});

Deno.test({
  name: "walk() walks fifo files on unix",
  ignore: Deno.build.os === "windows",
  async fn() {
    const tempDirPath = await Deno.makeTempDir({
      prefix: "deno_std_walk_",
    });
    // Copy contents from "walk/fifo" into temporary directory.
    await copy(resolve(testdataDir, "fifo"), resolve(tempDirPath, "fifo"));
    const command = new Deno.Command("mkfifo", {
      args: [resolve(tempDirPath, "fifo", "fifo")],
    });
    await command.output();
    await assertWalkPaths(tempDirPath, "fifo", [".", "fifo", ".gitignore"], {
      followSymlinks: true,
    });
    await Deno.remove(tempDirPath, { recursive: true });
  },
});

Deno.test({
  name: "walkSync() walks fifo files on unix",
  ignore: Deno.build.os === "windows",
  fn() {
    const tempDirPath = Deno.makeTempDirSync({
      prefix: "deno_std_walk_sync_",
    });
    // Copy contents from "walk/fifo" into temporary directory.
    copySync(resolve(testdataDir, "fifo"), resolve(tempDirPath, "fifo"));
    const command = new Deno.Command("mkfifo", {
      args: [resolve(tempDirPath, "fifo", "fifo")],
    });
    command.outputSync();
    assertWalkSyncPaths(tempDirPath, "fifo", [".", "fifo", ".gitignore"], {
      followSymlinks: true,
    });
    Deno.removeSync(tempDirPath, { recursive: true });
  },
});

Deno.test("walk() rejects with `Deno.errors.NotFound` when root is removed during execution", async () => {
  const tempDirPath = await Deno.makeTempDir({
    prefix: "deno_std_walk_",
  });
  const root = resolve(tempDirPath, "error");
  await Deno.mkdir(root);
  try {
    await assertRejects(
      async () => {
        await Array.fromAsync(
          walk(root),
          async () => await Deno.remove(root, { recursive: true }),
        );
      },
      Deno.errors.NotFound,
    );
  } catch (err) {
    await Deno.remove(root, { recursive: true });
    throw err;
  } finally {
    await Deno.remove(tempDirPath, { recursive: true });
  }
});
