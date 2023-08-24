// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { walk, WalkEntry, WalkError, WalkOptions, walkSync } from "./walk.ts";
import {
  assertArrayIncludes,
  assertEquals,
  assertRejects,
  assertThrows,
} from "../assert/mod.ts";
import { fromFileUrl, resolve } from "../path/mod.ts";

const testdataDir = resolve(fromFileUrl(import.meta.url), "../testdata/walk");

async function toArray(iterator: AsyncIterableIterator<WalkEntry>) {
  const entries = [];
  for await (const entry of iterator) {
    entries.push(entry);
  }
  return entries;
}

async function assertWalkPaths(
  rootPath: string,
  expectedPaths: string[],
  options?: WalkOptions,
) {
  const root = resolve(testdataDir, rootPath);
  const entries = await toArray(walk(root, options));
  const entriesSync = Array.from(walkSync(root, options));

  const expected = expectedPaths.map((path) => resolve(root, path));
  assertEquals(entries, entriesSync);
  assertEquals(entries.length, expected.length);
  assertArrayIncludes(entries.map(({ path }) => path), expected);
}

Deno.test("[fs/walk] empty dir", async () => {
  const emptyDir = resolve(testdataDir, "empty_dir");
  await Deno.mkdir(emptyDir);
  await assertWalkPaths("empty_dir", ["."]);
  await Deno.remove(emptyDir);
});

Deno.test("[fs/walk] single file", async () =>
  await assertWalkPaths("single_file", [".", "x"]));

Deno.test("[fs/walk] nested single file", async () =>
  await assertWalkPaths("nested_single_file", [".", "a", "a/x"]));

Deno.test("[fs/walk] max depth", async () =>
  await assertWalkPaths("depth", [".", "a", "a/b", "a/b/c"], { maxDepth: 3 }));

Deno.test("[fs/walk] exclude dirs", async () =>
  await assertWalkPaths("depth", ["a/b/c/d/x"], { includeDirs: false }));

Deno.test("[fs/walk] exclude files", async () =>
  await assertWalkPaths("depth", [".", "a", "a/b", "a/b/c", "a/b/c/d"], {
    includeFiles: false,
  }));

Deno.test("[fs/walk] ext", async () =>
  await assertWalkPaths("ext", ["y.rs", "x.ts"], {
    exts: [".rs", ".ts"],
  }));

Deno.test("[fs/walk] ext", async () =>
  await assertWalkPaths("match", ["x", "y"], {
    match: [/x/, /y/],
  }));

Deno.test("[fs/walk] skip", async () =>
  await assertWalkPaths("match", [".", "z"], {
    skip: [/x/, /y/],
  }));

// https://github.com/denoland/deno_std/issues/1358
Deno.test("[fs/walk] symlink", async () =>
  await assertWalkPaths("symlink", [".", "x", "x"], {
    followSymlinks: true,
  }));

Deno.test("[fs/walk] symlink without followSymlink", async () => {
  await assertWalkPaths("symlink", [".", "x", "y"], {
    followSymlinks: false,
  });
});

Deno.test("[fs/walk] non-existent root", async () => {
  const root = resolve(testdataDir, "non_existent");
  await assertRejects(
    async () => await toArray(walk(root)),
    Deno.errors.NotFound,
  );
  assertThrows(() => Array.from(walkSync(root)), Deno.errors.NotFound);
});

// https://github.com/denoland/deno_std/issues/1789
Deno.test({
  name: "[fs/walk] unix socket",
  ignore: Deno.build.os === "windows",
  async fn() {
    const path = resolve(testdataDir, "socket", "a.sock");
    try {
      const listener = Deno.listen({ path, transport: "unix" });
      await assertWalkPaths("socket", [".", "a.sock", ".gitignore"], {
        followSymlinks: true,
      });
      listener.close();
    } finally {
      await Deno.remove(path);
    }
  },
});

Deno.test({
  name: "[fs/walk] fifo",
  ignore: Deno.build.os === "windows",
  async fn() {
    const command = new Deno.Command("mkfifo", {
      args: [resolve(testdataDir, "fifo", "fifo")],
    });
    await command.output();
    await assertWalkPaths("fifo", [".", "fifo", ".gitignore"], {
      followSymlinks: true,
    });
  },
});

Deno.test("[fs/walk] error", async () => {
  const root = resolve(testdataDir, "error");
  await Deno.mkdir(root);
  await assertRejects(async () => {
    for await (const _entry of walk(root)) {
      await Deno.remove(root, { recursive: true });
    }
  }, WalkError);
});
