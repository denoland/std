// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import {
  assertEquals,
  assertThrows,
  assertThrowsAsync,
  assert
} from "../testing/asserts.ts";
import { copy, copySync } from "./copy.ts";
import { exists, existsSync } from "./exists.ts";
import * as path from "./path/mod.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { ensureFile, ensureFileSync } from "./ensure_file.ts";
import { ensureSymlink, ensureSymlinkSync } from "./ensure_symlink.ts";

const testdataDir = path.resolve("fs", "testdata");

// TODO(axetroy): Add test for Windows once symlink is implemented for Windows.
const isWindows = Deno.platform.os === "win";
const tempDirPrefix = "deno_std_copy_test_";

test({
  name: "[fs] copy file if it does no exist",
  async fn(): Promise<void> {
    const destDir = await Deno.makeTempDir({ prefix: tempDirPrefix });
    const srcFile = path.join(testdataDir, "copy_file_not_exists.txt");
    const destFile = path.join(destDir, "copy_file_not_exists_1.txt");
    await assertThrowsAsync(
      async (): Promise<void> => {
        await copy(srcFile, destFile);
      }
    );
    await Deno.remove(destDir, { recursive: true });
  }
});

test({
  name: "[fs] copy if src and dest are the same paths",
  async fn(): Promise<void> {
    const destDir = await Deno.makeTempDir({ prefix: tempDirPrefix });
    const srcFile = path.join(destDir, "copy_file_same.txt");
    const destFile = path.join(destDir, "copy_file_same.txt");

    await ensureDir(destDir);

    await assertThrowsAsync(
      async (): Promise<void> => {
        await copy(srcFile, destFile);
      },
      Error,
      "Source and destination can not be the same."
    );
    await Deno.remove(destDir, { recursive: true });
  }
});

test({
  name: "[fs] copy file",
  async fn(): Promise<void> {
    const destDir = await Deno.makeTempDir({ prefix: tempDirPrefix });
    const srcFile = path.join(testdataDir, "copy_file.txt");
    const destFile = path.join(destDir, "copy_file_copy.txt");

    const srcContent = new TextDecoder().decode(await Deno.readFile(srcFile));

    assertEquals(
      await exists(srcFile),
      true,
      `source should exist before copy`
    );
    assertEquals(
      await exists(destFile),
      false,
      "destination should not exist before copy"
    );

    await copy(srcFile, destFile);

    assertEquals(await exists(srcFile), true, "source should exist after copy");
    assertEquals(
      await exists(destFile),
      true,
      "destination should exist before copy"
    );

    const destContent = new TextDecoder().decode(await Deno.readFile(destFile));

    assertEquals(
      srcContent,
      destContent,
      "source and destination should have the same content"
    );

    // Copy again and it should throw an error.
    await assertThrowsAsync(
      async (): Promise<void> => {
        await copy(srcFile, destFile);
      },
      Error,
      `'${destFile}' already exists`
    );

    // update dest file
    await Deno.writeFile(destFile, new TextEncoder().encode("txt copy"));

    assertEquals(
      new TextDecoder().decode(await Deno.readFile(destFile)),
      "txt copy"
    );

    // Copy again with overwrite option.
    await copy(srcFile, destFile, { overwrite: true });

    // Make sure the file has been overwritten.
    assertEquals(
      new TextDecoder().decode(await Deno.readFile(destFile)),
      "txt"
    );

    await Deno.remove(destDir, { recursive: true });
  }
});

test({
  name: "[fs] copy with preserve timestamps",
  async fn(): Promise<void> {
    const destDir = await Deno.makeTempDir({ prefix: tempDirPrefix });
    const srcFile = path.join(testdataDir, "copy_file.txt");
    const destFile = path.join(destDir, "copy_file_copy.txt");

    const srcStatInfo = await Deno.stat(srcFile);

    assert(typeof srcStatInfo.accessed === "number");
    assert(typeof srcStatInfo.modified === "number");

    // Copy with overwrite and preserve timestamps options.
    await copy(srcFile, destFile, {
      overwrite: true,
      preserveTimestamps: true
    });

    const destStatInfo = await Deno.stat(destFile);

    assert(typeof destStatInfo.accessed === "number");
    assert(typeof destStatInfo.modified === "number");
    assertEquals(destStatInfo.accessed, srcStatInfo.accessed);
    assertEquals(destStatInfo.modified, srcStatInfo.modified);

    await Deno.remove(destDir, { recursive: true });
  }
});

test({
  name: "[fs] copy directory to its subdirectory",
  async fn(): Promise<void> {
    const tempDir = await Deno.makeTempDir({ prefix: tempDirPrefix });
    const srcDir = path.join(tempDir, "parent");
    const destDir = path.join(srcDir, "child");

    await ensureDir(srcDir);

    await assertThrowsAsync(
      async (): Promise<void> => {
        await copy(srcDir, destDir);
      },
      Error,
      `Cannot copy '${srcDir}' to a subdirectory of itself, '${destDir}'.`
    );

    await Deno.remove(tempDir, { recursive: true });
  }
});

test({
  name: "[fs] copy directory and destination exist and not a directory",
  async fn(): Promise<void> {
    const tempDir = await Deno.makeTempDir({ prefix: tempDirPrefix });
    const srcDir = path.join(tempDir, "parent");
    const destDir = path.join(tempDir, "child.txt");

    await ensureDir(srcDir);
    await ensureFile(destDir);

    await assertThrowsAsync(
      async (): Promise<void> => {
        await copy(srcDir, destDir);
      },
      Error,
      `Cannot overwrite non-directory '${destDir}' with directory '${srcDir}'.`
    );

    await Deno.remove(tempDir, { recursive: true });
  }
});

test({
  name: "[fs] copy directory",
  async fn(): Promise<void> {
    const tempDir = await Deno.makeTempDir({ prefix: tempDirPrefix });
    const srcDir = path.join(testdataDir, "copy_dir");
    const destDir = path.join(tempDir, "copy_dir");
    const srcFile = path.join(srcDir, "0.txt");
    const destFile = path.join(destDir, "0.txt");
    const srcNestFile = path.join(srcDir, "nest", "0.txt");
    const destNestFile = path.join(destDir, "nest", "0.txt");

    await copy(srcDir, destDir);

    assertEquals(await exists(destFile), true);
    assertEquals(await exists(destNestFile), true);

    // After copy. The source and destination should have the same content.
    assertEquals(
      new TextDecoder().decode(await Deno.readFile(srcFile)),
      new TextDecoder().decode(await Deno.readFile(destFile))
    );
    assertEquals(
      new TextDecoder().decode(await Deno.readFile(srcNestFile)),
      new TextDecoder().decode(await Deno.readFile(destNestFile))
    );

    // Copy again without overwrite option and it should throw an error.
    await assertThrowsAsync(
      async (): Promise<void> => {
        await copy(srcDir, destDir);
      },
      Error,
      `'${destDir}' already exists`
    );

    // Modify the file in the destination directory.
    await Deno.writeFile(destNestFile, new TextEncoder().encode("nest copy"));
    assertEquals(
      new TextDecoder().decode(await Deno.readFile(destNestFile)),
      "nest copy"
    );

    // Copy again with overwrite option.
    await copy(srcDir, destDir, { overwrite: true });

    // Make sure the file has been overwritten.
    assertEquals(
      new TextDecoder().decode(await Deno.readFile(destNestFile)),
      "nest"
    );

    await Deno.remove(destDir, { recursive: true });
  }
});

test({
  name: "[fs] copy symlink file",
  async fn(): Promise<void> {
    const destDir = await Deno.makeTempDir({ prefix: tempDirPrefix });
    const dir = path.join(testdataDir, "copy_dir_link_file");
    const srcLink = path.join(dir, "0.txt"); // this is a file link
    const destLink = path.join(destDir, "0-copy.txt"); // this is a file link

    if (isWindows) {
      await assertThrowsAsync(
        // (): Promise<void> => copy(srcLink, destLink),
        (): Promise<void> => ensureSymlink(srcLink, destLink)
      );
      return;
    }

    assert(
      (await Deno.lstat(srcLink)).isSymlink(),
      `'${srcLink}' should be symlink type`
    );

    await copy(srcLink, destLink);

    const statInfo = await Deno.lstat(destLink);

    assert(statInfo.isSymlink(), `'${destLink}' should be symlink type`);

    await Deno.remove(destLink, { recursive: true });
  }
});

test({
  name: "[fs] copy symlink directory",
  async fn(): Promise<void> {
    const destDir = await Deno.makeTempDir({ prefix: tempDirPrefix });
    const srcDir = path.join(testdataDir, "copy_dir"); // origin dir
    const srcLink = path.join(testdataDir, "copy_dir_link"); // this is a dir link
    const destLink = path.join(destDir, "copy_dir_link_copy");

    if (isWindows) {
      await assertThrowsAsync(
        // (): Promise<void> => copy(srcLink, destLink),
        (): Promise<void> => ensureSymlink(srcLink, destLink)
      );
      return;
    }

    await ensureSymlink(srcDir, srcLink);

    assert(
      (await Deno.lstat(srcLink)).isSymlink(),
      `'${srcLink}' should be symlink type`
    );

    await copy(srcLink, destLink);

    const statInfo = await Deno.lstat(destLink);

    assert(statInfo.isSymlink());

    await Deno.remove(srcLink, { recursive: true });
    await Deno.remove(destLink, { recursive: true });
  }
});

test({
  name: "[fs] copy file synchronously if it does not exist",
  fn(): void {
    const destDir = Deno.makeTempDirSync({ prefix: tempDirPrefix });
    const srcFile = path.join(testdataDir, "copy_file_not_exists_sync.txt");
    const destFile = path.join(destDir, "copy_file_not_exists_1_sync.txt");
    assertThrows(
      (): void => {
        copySync(srcFile, destFile);
      }
    );
  }
});

test({
  name: "[fs] copy synchronously with preserve timestamps",
  fn(): void {
    const destDir = Deno.makeTempDirSync({ prefix: tempDirPrefix });
    const srcFile = path.join(testdataDir, "copy_file.txt");
    const destFile = path.join(destDir, "copy_file_copy.txt");

    const srcStatInfo = Deno.statSync(srcFile);

    assert(typeof srcStatInfo.accessed === "number");
    assert(typeof srcStatInfo.modified === "number");

    // Copy with overwrite and preserve timestamps options.
    copySync(srcFile, destFile, {
      overwrite: true,
      preserveTimestamps: true
    });

    const destStatInfo = Deno.statSync(destFile);

    assert(typeof destStatInfo.accessed === "number");
    assert(typeof destStatInfo.modified === "number");
    assertEquals(destStatInfo.accessed, srcStatInfo.accessed);
    assertEquals(destStatInfo.modified, srcStatInfo.modified);

    Deno.removeSync(destDir, { recursive: true });
  }
});

test({
  name: "[fs] copy synchronously if src and dest are the same paths",
  fn(): void {
    const srcFile = path.join(testdataDir, "copy_file_same_sync.txt");
    assertThrows(
      (): void => {
        copySync(srcFile, srcFile);
      },
      Error,
      "Source and destination must not be the same."
    );
  }
});

test({
  name: "[fs] copy file synchronously",
  fn(): void {
    const destDir = Deno.makeTempDirSync({ prefix: tempDirPrefix });
    const srcFile = path.join(testdataDir, "copy_file.txt");
    const destFile = path.join(destDir, "copy_file_copy_sync.txt");

    const srcContent = new TextDecoder().decode(Deno.readFileSync(srcFile));

    assertEquals(existsSync(srcFile), true);
    assertEquals(existsSync(destFile), false);

    copySync(srcFile, destFile);

    assertEquals(existsSync(srcFile), true);
    assertEquals(existsSync(destFile), true);

    const destContent = new TextDecoder().decode(Deno.readFileSync(destFile));

    assertEquals(srcContent, destContent);

    // Copy again without overwrite option and it should throw an error.
    assertThrows(
      (): void => {
        copySync(srcFile, destFile);
      },
      Error,
      `'${destFile}' already exists`
    );

    // update dest file
    Deno.writeFileSync(destFile, new TextEncoder().encode("txt copy"));

    assertEquals(
      new TextDecoder().decode(Deno.readFileSync(destFile)),
      "txt copy"
    );

    // Copy again with overwrite option.
    copySync(srcFile, destFile, { overwrite: true });

    // Make sure the file has been overwritten.
    assertEquals(new TextDecoder().decode(Deno.readFileSync(destFile)), "txt");

    Deno.removeSync(destDir, { recursive: true });
  }
});

test({
  // name: "[fs] copy directory synchronously from parent dir",
  name: "[fs] copy directory synchronously to its subdirectory",
  fn(): void {
    const tempDir = Deno.makeTempDirSync({ prefix: tempDirPrefix });
    const srcDir = path.join(tempDir, "parent_sync");
    const destDir = path.join(srcDir, "child");

    ensureDirSync(srcDir);

    assertThrows(
      (): void => {
        copySync(srcDir, destDir);
      },
      Error,
      `Cannot copy '${srcDir}' to a subdirectory of itself, '${destDir}'.`
    );

    Deno.removeSync(tempDir, { recursive: true });
  }
});

test({
  name:
    "[fs] copy directory synchronously, and destination exist and not a directory",
  fn(): void {
    const tempDir = Deno.makeTempDirSync({ prefix: tempDirPrefix });
    const srcDir = path.join(tempDir, "parent_sync");
    const destDir = path.join(tempDir, "child.txt");

    ensureDirSync(srcDir);
    ensureFileSync(destDir);

    assertThrows(
      (): void => {
        copySync(srcDir, destDir);
      },
      Error,
      `Cannot overwrite non-directory '${destDir}' with directory '${srcDir}'.`
    );

    Deno.removeSync(tempDir, { recursive: true });
  }
});

test({
  name: "[fs] copy directory synchronously",
  fn(): void {
    const tempDir = Deno.makeTempDirSync({ prefix: tempDirPrefix });
    const srcDir = path.join(testdataDir, "copy_dir");
    const destDir = path.join(tempDir, "copy_dir_copy_sync");
    const srcFile = path.join(srcDir, "0.txt");
    const destFile = path.join(destDir, "0.txt");
    const srcNestFile = path.join(srcDir, "nest", "0.txt");
    const destNestFile = path.join(destDir, "nest", "0.txt");

    copySync(srcDir, destDir);

    assertEquals(existsSync(destFile), true);
    assertEquals(existsSync(destNestFile), true);

    // should have the same content
    assertEquals(
      new TextDecoder().decode(Deno.readFileSync(srcFile)),
      new TextDecoder().decode(Deno.readFileSync(destFile))
    );
    assertEquals(
      new TextDecoder().decode(Deno.readFileSync(srcNestFile)),
      new TextDecoder().decode(Deno.readFileSync(destNestFile))
    );

    // Copy again without overwrite option and it should throw an error.
    assertThrows(
      (): void => {
        copySync(srcDir, destDir);
      },
      Error,
      `'${destDir}' already exists`
    );

    // Modify the file in the destination directory.
    Deno.writeFileSync(destNestFile, new TextEncoder().encode("nest copy"));
    assertEquals(
      new TextDecoder().decode(Deno.readFileSync(destNestFile)),
      "nest copy"
    );

    // Copy again with overwrite option.
    copySync(srcDir, destDir, { overwrite: true });

    // Make sure the file has been overwritten.
    assertEquals(
      new TextDecoder().decode(Deno.readFileSync(destNestFile)),
      "nest"
    );

    Deno.removeSync(tempDir, { recursive: true });
  }
});

test({
  name: "[fs] copy symlink file synchronously",
  fn(): void {
    const tempDir = Deno.makeTempDirSync({ prefix: tempDirPrefix });
    const dir = path.join(testdataDir, "copy_dir_link_file");
    const srcLink = path.join(dir, "0.txt"); // this is a file link
    const destLink = path.join(tempDir, "0-copy.txt"); // this is a file link

    if (isWindows) {
      assertThrows(
        // (): void => copySync(srcLink, destLink),
        (): void => ensureSymlinkSync(srcLink, destLink)
      );
      return;
    }

    assert(
      Deno.lstatSync(srcLink).isSymlink(),
      `'${srcLink}' should be symlink type`
    );

    copySync(srcLink, destLink);

    const statInfo = Deno.lstatSync(destLink);

    assert(statInfo.isSymlink(), `'${destLink}' should be symlink type`);

    Deno.removeSync(tempDir, { recursive: true });
  }
});

test({
  name: "[fs] copy symlink directory synchronously",
  fn(): void {
    const destDir = Deno.makeTempDirSync({ prefix: tempDirPrefix });
    const originDir = path.join(testdataDir, "copy_dir"); // origin dir
    const srcLink = path.join(destDir, "copy_dir_link"); // this is a dir link
    const destLink = path.join(destDir, "copy_dir_link_copy");

    if (isWindows) {
      assertThrows(
        // (): void => copySync(srcLink, destLink),
        (): void => ensureSymlinkSync(srcLink, destLink)
      );
      return;
    }

    ensureSymlinkSync(originDir, srcLink);

    assert(
      Deno.lstatSync(srcLink).isSymlink(),
      `'${srcLink}' should be symlink type`
    );

    copySync(srcLink, destLink);

    const statInfo = Deno.lstatSync(destLink);

    assert(statInfo.isSymlink());

    Deno.removeSync(destDir, { recursive: true });
  }
});
