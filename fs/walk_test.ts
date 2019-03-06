const {
  cwd,
  chdir,
  makeTempDir,
  mkdir,
  open,
  platform,
  remove,
  symlink
} = Deno;
import { FileInfo } from "deno";
import { walk, walkSync, WalkOptions } from "./walk.ts";
import { test, assert, TestFunction } from "../testing/mod.ts";
import { assertEqual } from "../testing/asserts.ts";

const isWindows = platform.os === "win";

export async function testWalk(
  setup: (string) => void | Promise<void>,
  t: TestFunction
): Promise<void> {
  const name = t.name;
  async function fn() {
    const orig_cwd = cwd();
    const d = await makeTempDir();
    chdir(d);
    try {
      await setup(d);
      await t();
    } finally {
      chdir(orig_cwd);
      remove(d, { recursive: true });
    }
  }
  test({ name, fn });
}

async function walkArray(
  dirname: string = ".",
  options: WalkOptions = {}
): Promise<Array<string>> {
  const arr: string[] = [];
  for await (const f of walk(dirname, { ...options })) {
    arr.push(f.path.replace(/\\/g, "/"));
  }
  arr.sort();
  const arr_sync = Array.from(walkSync(dirname, options), (f: FileInfo) =>
    f.path.replace(/\\/g, "/")
  ).sort();
  assertEqual(arr, arr_sync);
  return arr;
}

async function touch(path: string): Promise<void> {
  await open(path, "w");
}
function assertReady(expectedLength: number) {
  const arr = Array.from(walkSync(), (f: FileInfo) => f.path);
  assertEqual(arr.length, expectedLength);
}

testWalk(
  async (d: string) => {
    await mkdir(d + "/empty");
  },
  async function emptyDir() {
    const arr = await walkArray();
    assertEqual(arr.length, 0);
  }
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
  },
  async function singleFile() {
    const arr = await walkArray();
    assertEqual(arr.length, 1);
    assertEqual(arr[0], "./x");
  }
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
  },
  async function iteratable() {
    let count = 0;
    for (const f of walkSync()) {
      count += 1;
    }
    assertEqual(count, 1);
    for await (const f of walk()) {
      count += 1;
    }
    assertEqual(count, 2);
  }
);

testWalk(
  async (d: string) => {
    await mkdir(d + "/a");
    await touch(d + "/a/x");
  },
  async function nestedSingleFile() {
    const arr = await walkArray();
    assertEqual(arr.length, 1);
    assertEqual(arr[0], "./a/x");
  }
);

testWalk(
  async (d: string) => {
    await mkdir(d + "/a/b/c/d", true);
    await touch(d + "/a/b/c/d/x");
  },
  async function depth() {
    assertReady(1);
    const arr_3 = await walkArray(".", { maxDepth: 3 });
    assertEqual(arr_3.length, 0);
    const arr_5 = await walkArray(".", { maxDepth: 5 });
    assertEqual(arr_5.length, 1);
    assertEqual(arr_5[0], "./a/b/c/d/x");
  }
);

testWalk(
  async (d: string) => {
    await touch(d + "/x.ts");
    await touch(d + "/y.rs");
  },
  async function ext() {
    assertReady(2);
    const arr = await walkArray(".", { exts: [".ts"] });
    assertEqual(arr.length, 1);
    assertEqual(arr[0], "./x.ts");
  }
);

testWalk(
  async (d: string) => {
    await touch(d + "/x.ts");
    await touch(d + "/y.rs");
    await touch(d + "/z.py");
  },
  async function extAny() {
    assertReady(3);
    const arr = await walkArray(".", { exts: [".rs", ".ts"] });
    assertEqual(arr.length, 2);
    assertEqual(arr[0], "./x.ts");
    assertEqual(arr[1], "./y.rs");
  }
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
    await touch(d + "/y");
  },
  async function match() {
    assertReady(2);
    const arr = await walkArray(".", { match: [/x/] });
    assertEqual(arr.length, 1);
    assertEqual(arr[0], "./x");
  }
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
    await touch(d + "/y");
    await touch(d + "/z");
  },
  async function matchAny() {
    assertReady(3);
    const arr = await walkArray(".", { match: [/x/, /y/] });
    assertEqual(arr.length, 2);
    assertEqual(arr[0], "./x");
    assertEqual(arr[1], "./y");
  }
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
    await touch(d + "/y");
  },
  async function skip() {
    assertReady(2);
    const arr = await walkArray(".", { skip: [/x/] });
    assertEqual(arr.length, 1);
    assertEqual(arr[0], "./y");
  }
);

testWalk(
  async (d: string) => {
    await touch(d + "/x");
    await touch(d + "/y");
    await touch(d + "/z");
  },
  async function skipAny() {
    assertReady(3);
    const arr = await walkArray(".", { skip: [/x/, /y/] });
    assertEqual(arr.length, 1);
    assertEqual(arr[0], "./z");
  }
);

testWalk(
  async (d: string) => {
    await mkdir(d + "/a");
    await mkdir(d + "/b");
    await touch(d + "/a/x");
    await touch(d + "/a/y");
    await touch(d + "/b/z");
  },
  async function subDir() {
    assertReady(3);
    const arr = await walkArray("b");
    assertEqual(arr.length, 1);
    assertEqual(arr[0], "b/z");
  }
);

testWalk(async (d: string) => {}, async function onError() {
  assertReady(0);
  const ignored = await walkArray("missing");
  assertEqual(ignored.length, 0);
  let errors = 0;
  const arr = await walkArray("missing", { onError: e => (errors += 1) });
  // It's 2 since walkArray iterates over both sync and async.
  assertEqual(errors, 2);
});

testWalk(
  async (d: string) => {
    await mkdir(d + "/a");
    await mkdir(d + "/b");
    await touch(d + "/a/x");
    await touch(d + "/a/y");
    await touch(d + "/b/z");
    try {
      await symlink(d + "/b", d + "/a/bb");
    } catch (err) {
      assert(isWindows);
      assert(err.message, "Not implemented");
    }
  },
  async function symlink() {
    // symlink is not yet implemented on Windows.
    if (isWindows) {
      return;
    }

    assertReady(3);
    const files = await walkArray("a");
    assertEqual(files.length, 2);
    assert(!files.includes("a/bb/z"));

    const arr = await walkArray("a", { followSymlinks: true });
    assertEqual(arr.length, 3);
    assert(arr.some(f => f.endsWith("/b/z")));
  }
);
