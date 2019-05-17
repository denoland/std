// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
// TODO(axetroy): Add test for Windows once symlink is implemented for Windows.
import { test } from "../testing/mod.ts";
import {
  assert,
  assertEquals,
  assertThrows,
  assertThrowsAsync
} from "../testing/asserts.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import * as path from "./path/mod.ts";

const testdataDir = path.resolve("fs", "testdata");
const isWindows = Deno.platform.os === "win";

async function testEnsureDir(
  name: string,
  cb: (tempDir: string) => Promise<void>
): Promise<void> {
  test({
    name,
    async fn(): Promise<void> {
      const tempDir = await Deno.makeTempDir({
        prefix: "deno_std_ensure_dir_async_test_"
      });
      await cb(tempDir);
      await Deno.remove(tempDir, { recursive: true });
    }
  });
}

function testEnsureDirSync(name: string, cb: (tempDir: string) => void): void {
  test({
    name,
    fn: (): void => {
      const tempDir = Deno.makeTempDirSync({
        prefix: "deno_std_ensure_dir_sync_test_"
      });
      cb(tempDir);
      Deno.removeSync(tempDir, { recursive: true });
    }
  });
}

testEnsureDir(
  "[fs] ensureDir if it does not exist",
  async (tempDir: string): Promise<void> => {
    const testDir = path.join(tempDir, "test");

    await assertThrowsAsync(
      async (): Promise<void> => {
        await Deno.stat(testDir);
      }
    );

    await ensureDir(testDir);

    // Make sure directory has been create.
    await Deno.stat(testDir);
  }
);

testEnsureDirSync(
  "[fs] ensureDirSync if it does not exist",
  (tempDir: string): void => {
    const testDir = path.join(tempDir, "test");

    assertThrows(
      (): void => {
        Deno.statSync(testDir);
      }
    );

    ensureDirSync(testDir);

    // Make sure directory has been create.
    Deno.statSync(testDir);
  }
);

testEnsureDir(
  "[fs] ensureDir if it exist as a directory",
  async (tempDir: string): Promise<void> => {
    const testDir = path.join(tempDir, "test");
    const testFile = path.join(testDir, "test");

    await Deno.mkdir(testDir, true);
    await Deno.writeFile(testFile, new TextEncoder().encode("abc"));

    await ensureDir(testDir);

    // Make sure directory has been create.
    await Deno.stat(testDir);

    // Make sure the original file still exists
    assertEquals(
      new TextDecoder().decode(await Deno.readFile(testFile)),
      "abc"
    );
  }
);

testEnsureDirSync(
  "[fs] ensureDirSync if it exist as a directory",
  (tempDir: string): void => {
    const testDir = path.join(tempDir, "test");
    const testFile = path.join(testDir, "test");

    Deno.mkdirSync(testDir, true);
    Deno.writeFileSync(testFile, new TextEncoder().encode("abc"));

    ensureDirSync(testDir);

    // Make sure directory has been create.
    Deno.statSync(testDir);

    assertEquals(new TextDecoder().decode(Deno.readFileSync(testFile)), "abc");
  }
);

testEnsureDir(
  "[fs] ensureDir if it exist as a file",
  async (tempDir: string): Promise<void> => {
    const testFile = path.join(tempDir, "test");

    await Deno.writeFile(testFile, new Uint8Array());

    await assertThrowsAsync(
      async (): Promise<void> => {
        await ensureDir(testFile);
      },
      Error,
      `Ensure path exists, expected 'dir', got 'file'`
    );
  }
);

testEnsureDirSync(
  "[fs] ensureDirSync if it exist as a file",
  (tempDir: string): void => {
    const testFile = path.join(tempDir, "test");

    Deno.writeFileSync(testFile, new Uint8Array());

    assertThrows(
      (): void => {
        ensureDirSync(testFile);
      },
      Error,
      `Ensure path exists, expected 'dir', got 'file'`
    );
  }
);

testEnsureDir(
  "[fs] ensureDir if it exist as a symlink",
  async (): Promise<void> => {
    const testFile = path.join(testdataDir, "0-link.ts");

    const testStat = await Deno.lstat(testFile);

    if (isWindows) {
      assert(testStat.isFile());
      return;
    } else {
      assert(testStat.isSymlink());
    }

    await assertThrowsAsync(
      async (): Promise<void> => {
        await ensureDir(testFile);
      },
      Error,
      `Ensure path exists, expected 'dir', got 'symlink'`
    );
  }
);

testEnsureDirSync(
  "[fs] ensureDirSync if it exist as a symlink",
  (): void => {
    const testFile = path.join(testdataDir, "0-link.ts");

    const testStat = Deno.lstatSync(testFile);

    if (isWindows) {
      assert(testStat.isFile());
      return;
    } else {
      assert(testStat.isSymlink());
    }

    assertThrows(
      (): void => {
        ensureDirSync(testFile);
      },
      Error,
      `Ensure path exists, expected 'dir', got 'symlink'`
    );
  }
);
