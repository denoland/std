// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any
import { walk, WalkEntry, WalkError, WalkOptions, walkSync } from "./walk.ts";
import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertRejects,
  assertThrows,
} from "../assert/mod.ts";

export function testWalk(
  setup: (arg0: string) => any | Promise<any>,
  t: (context: any) => void | Promise<void>,
  ignore = false,
) {
  const name = t.name;
  async function fn() {
    const origCwd = Deno.cwd();
    const d = await Deno.makeTempDir();
    Deno.chdir(d);
    try {
      const context = await setup(d);
      await t(context);
    } finally {
      Deno.chdir(origCwd);
      await Deno.remove(d, { recursive: true });
    }
  }
  Deno.test({ ignore, name: `[walk] ${name}`, fn });
}

function normalize({ path }: WalkEntry): string {
  return path.replace(/\\/g, "/");
}

/**
 * Ensure that `walk()` and `walkSync()` return the same entries.
 */
export async function collectEntries(
  root: string,
  options: WalkOptions = {},
): Promise<WalkEntry[]> {
  const entries: WalkEntry[] = [];
  for await (const w of walk(root, { ...options })) {
    entries.push({
      ...w,
      path: normalize(w),
    });
  }
  const entriesSync = Array.from(walkSync(root, options), (w) => {
    return {
      ...w,
      path: normalize(w),
    };
  });
  assertEquals(entries, entriesSync);
  return entries;
}

/**
 * Collect and compare the paths from `walk()` and `walkSync()` instead of the
 * whole WalkEntry as in `collectEntries()`.
 */
export async function collectPaths(
  root: string,
  options: WalkOptions = {},
): Promise<string[]> {
  const arr: string[] = [];
  for await (const w of walk(root, { ...options })) {
    arr.push(normalize(w));
  }
  arr.sort(); // TODO(ry) Remove sort. The order should be deterministic.
  const arrSync = Array.from(walkSync(root, options), normalize);
  arrSync.sort(); // TODO(ry) Remove sort. The order should be deterministic.
  assertEquals(arr, arrSync);
  return arr;
}

export async function touch(path: string) {
  const f = await Deno.create(path);
  f.close();
}

function assertReady(expectedLength: number) {
  const arr = Array.from(walkSync("."), normalize);
  assertEquals(arr.length, expectedLength);
}

testWalk(
  async (d: string) => {
    await Deno.mkdir(d + "/empty");
  },
  async function emptyDir() {
    const arr = await collectPaths(".");
    assertEquals(arr, [".", "empty"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
  },
  async function singleFile() {
    const arr = await collectPaths(".");
    assertEquals(arr, [".", "x"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
  },
  async function iterable() {
    let count = 0;
    for (const _ of walkSync(".")) {
      count += 1;
    }
    assertEquals(count, 2);
    for await (const _ of walk(".")) {
      count += 1;
    }
    assertEquals(count, 4);
  },
);

testWalk(
  async (d: string) => {
    await Deno.mkdir(d + "/a");
    await touch(d + "/a/x");
  },
  async function nestedSingleFile() {
    const arr = await collectPaths(".");
    assertEquals(arr, [".", "a", "a/x"]);
  },
);

testWalk(
  async (d: string) => {
    await Deno.mkdir(d + "/a/b/c/d", { recursive: true });
    await touch(d + "/a/b/c/d/x");
  },
  async function depth() {
    assertReady(6);
    const arr3 = await collectPaths(".", { maxDepth: 3 });
    assertEquals(arr3, [".", "a", "a/b", "a/b/c"]);
    const arr5 = await collectPaths(".", { maxDepth: 5 });
    assertEquals(arr5, [".", "a", "a/b", "a/b/c", "a/b/c/d", "a/b/c/d/x"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/a");
    await Deno.mkdir(d + "/b");
    await touch(d + "/b/c");
  },
  async function includeDirs() {
    assertReady(4);
    const arr = await collectPaths(".", { includeDirs: false });
    assertEquals(arr, ["a", "b/c"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/a");
    await Deno.mkdir(d + "/b");
    await touch(d + "/b/c");
  },
  async function includeFiles() {
    assertReady(4);
    const arr = await collectPaths(".", { includeFiles: false });
    assertEquals(arr, [".", "b"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/x.ts");
    await touch(d + "/y.rs");
  },
  async function ext() {
    assertReady(3);
    const arr = await collectPaths(".", { exts: [".ts"] });
    assertEquals(arr, ["x.ts"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/x.ts");
    await touch(d + "/y.rs");
    await touch(d + "/z.py");
  },
  async function extAny() {
    assertReady(4);
    const arr = await collectPaths(".", { exts: [".rs", ".ts"] });
    assertEquals(arr, ["x.ts", "y.rs"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
    await touch(d + "/y");
  },
  async function match() {
    assertReady(3);
    const arr = await collectPaths(".", { match: [/x/] });
    assertEquals(arr, ["x"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
    await touch(d + "/y");
    await touch(d + "/z");
  },
  async function matchAny() {
    assertReady(4);
    const arr = await collectPaths(".", { match: [/x/, /y/] });
    assertEquals(arr, ["x", "y"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
    await touch(d + "/y");
  },
  async function skip() {
    assertReady(3);
    const arr = await collectPaths(".", { skip: [/x/] });
    assertEquals(arr, [".", "y"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
    await touch(d + "/y");
    await touch(d + "/z");
  },
  async function skipAny() {
    assertReady(4);
    const arr = await collectPaths(".", { skip: [/x/, /y/] });
    assertEquals(arr, [".", "z"]);
  },
);

testWalk(
  async (d: string) => {
    await Deno.mkdir(d + "/a");
    await Deno.mkdir(d + "/b");
    await touch(d + "/a/x");
    await touch(d + "/a/y");
    await touch(d + "/b/z");
  },
  async function subDir() {
    assertReady(6);
    const arr = await collectPaths("b");
    assertEquals(arr, ["b", "b/z"]);
  },
);

testWalk(
  async (_d: string) => {},
  async function nonexistentRoot() {
    await assertRejects(async () => {
      await collectPaths("nonexistent");
    }, Deno.errors.NotFound);
  },
);

testWalk(
  async (d: string) => {
    await Deno.mkdir(d + "/a");
    await Deno.mkdir(d + "/b");
    await touch(d + "/a/x");
    await Deno.symlink(d + "/b", d + "/a/l2b");
    await Deno.symlink(d + "/a/x", d + "/a/l2x", { type: "file" });
  },
  async function symlinks() {
    assertReady(6);
    const entries = await collectEntries("a");
    assertEquals(entries.length, 4);
    assertObjectMatch(entries[0], {
      path: "a",
      isSymlink: false,
      isDirectory: true,
      isFile: false,
    });
    assertObjectMatch(entries[1], {
      path: "a/l2x",
      isSymlink: true,
      isDirectory: false,
      isFile: false,
    });
    assertObjectMatch(entries[2], {
      path: "a/l2b",
      isSymlink: true,
      isDirectory: false,
      isFile: false,
    });
    assertObjectMatch(entries[3], {
      path: "a/x",
      isSymlink: false,
      isDirectory: false,
      isFile: true,
    });
  },
);

testWalk(
  async (d: string) => {
    await Deno.mkdir(d + "/a");
    await Deno.mkdir(d + "/b");
    await touch(d + "/a/x");
    await touch(d + "/a/y");
    await touch(d + "/b/z");
    await Deno.symlink(d + "/b", d + "/a/bb");
  },
  async function followSymlinks() {
    assertReady(7);
    const files = await collectPaths("a");
    assertEquals(files.length, 4);
    assert(!files.includes("a/bb/z"));

    const arr = await collectPaths("a", { followSymlinks: true });
    assertEquals(arr.length, 5);
    assert(arr.some((f): boolean => f.endsWith("/b/z")));
  },
);

testWalk(
  async (d: string) => {
    await Deno.mkdir(d + "/a");
    await touch(d + "/a/x");
    await touch(d + "/a/y");
  },
  async function walkError() {
    await assertRejects(async () => {
      for await (const _walkEntry of walk("./a")) {
        await Deno.remove("./a", { recursive: true });
      }
    }, WalkError);
  },
);

// https://github.com/denoland/deno_std/issues/1358
testWalk(
  async (d: string) => {
    await Deno.mkdir(d + "/a");
    await touch(d + "/a/x");
    await touch(d + "/a/y");
    await touch(d + "/b");
    await Deno.symlink(d + "/b", d + "/a/bb");
  },
  async function symlinkPointsToFile() {
    assertReady(6);
    const files = await collectPaths("a", { followSymlinks: true });
    assertEquals(files.length, 4);
    assert(files.some((f): boolean => f.endsWith("/b")));
  },
);

// https://github.com/denoland/deno_std/issues/1789
testWalk(
  (d: string) => {
    return Deno.listen({ path: d + "/a", transport: "unix" });
  },
  async function unixSocket(listener: Deno.Listener) {
    assertReady(2);
    const files = await collectPaths(".", { followSymlinks: true });
    assertEquals(files, [".", "a"]);
    listener.close();
  },
  Deno.build.os === "windows",
);

testWalk(
  async (d: string) => {
    await Deno.mkdir(d + "/a/b", { recursive: true });
    await Deno.chmod(d + "/a/b", 0o000);
  },
  async function subDirNoPermissionAsync() {
    try {
      await assertRejects(
        async () => {
          await collectPaths("a");
        },
        Deno.errors.PermissionDenied,
        'for path "a/b"',
      );
    } finally {
      await Deno.chmod("a/b", 0o755);
    }
  },
  // TODO(kt3k): Enable this test
  true,
);

testWalk(
  async (d: string) => {
    await Deno.mkdir(d + "/a/b", { recursive: true });
    await Deno.chmod(d + "/a/b", 0o000);
  },
  async function subDirNoPermissionSync() {
    try {
      assertThrows(
        () => {
          return [...walkSync("a")];
        },
        Deno.errors.PermissionDenied,
        'for path "a/b"',
      );
    } finally {
      await Deno.chmod("a/b", 0o755);
    }
  },
  // TODO(kt3k): Enable this test
  true,
);

testWalk(
  async (d: string) => {
    const command = new Deno.Command("mkfifo", { args: [d + "/fifo"] });
    await command.output();
  },
  async function fifo() {
    assertReady(2);
    const files = await collectPaths(".", { followSymlinks: true });
    assertEquals(files, [".", "fifo"]);
  },
  Deno.build.os === "windows",
);
