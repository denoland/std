// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any
import { walk, WalkEntry, WalkOptions, walkSync } from "./walk.ts";
import {
  assert,
  assertEquals,
  assertRejects,
  assertThrows,
} from "../testing/asserts.ts";

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

export async function walkArray(
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
    const arr = await walkArray(".");
    assertEquals(arr, [".", "empty"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
  },
  async function singleFile() {
    const arr = await walkArray(".");
    assertEquals(arr, [".", "x"]);
  },
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
  },
  async function iteratable() {
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
    const arr = await walkArray(".");
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
    const arr3 = await walkArray(".", { maxDepth: 3 });
    assertEquals(arr3, [".", "a", "a/b", "a/b/c"]);
    const arr5 = await walkArray(".", { maxDepth: 5 });
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
    const arr = await walkArray(".", { includeDirs: false });
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
    const arr = await walkArray(".", { includeFiles: false });
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
    const arr = await walkArray(".", { exts: [".ts"] });
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
    const arr = await walkArray(".", { exts: [".rs", ".ts"] });
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
    const arr = await walkArray(".", { match: [/x/] });
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
    const arr = await walkArray(".", { match: [/x/, /y/] });
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
    const arr = await walkArray(".", { skip: [/x/] });
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
    const arr = await walkArray(".", { skip: [/x/, /y/] });
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
    const arr = await walkArray("b");
    assertEquals(arr, ["b", "b/z"]);
  },
);

testWalk(
  async (_d: string) => {},
  async function nonexistentRoot() {
    await assertRejects(async () => {
      await walkArray("nonexistent");
    }, Deno.errors.NotFound);
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
  async function symlink() {
    assertReady(6);
    const files = await walkArray("a");
    assertEquals(files.length, 3);
    assert(!files.includes("a/bb/z"));

    const arr = await walkArray("a", { followSymlinks: true });
    assertEquals(arr.length, 5);
    assert(arr.some((f): boolean => f.endsWith("/b/z")));
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
    assertReady(5);
    const files = await walkArray("a", { followSymlinks: true });
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
    const files = await walkArray(".", { followSymlinks: true });
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
          await walkArray("a");
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
    const files = await walkArray(".", { followSymlinks: true });
    assertEquals(files, [".", "fifo"]);
  },
  Deno.build.os === "windows",
);
