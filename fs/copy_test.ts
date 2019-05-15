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

test({
  name: "[fs] copy file if it does no exist",
  async fn(): Promise<void> {
    const srcFile = path.join(testdataDir, "copy_file_not_exists.txt");
    const destFile = path.join(testdataDir, "copy_file_not_exists_1.txt");
    await assertThrowsAsync(
      async (): Promise<void> => {
        await copy(srcFile, destFile);
      }
    );
  }
});

test({
  name: "[fs] copy if src and dest is same path",
  async fn(): Promise<void> {
    const srcFile = path.join(testdataDir, "copy_file_same.txt");
    await assertThrowsAsync(
      async (): Promise<void> => {
        await copy(srcFile, srcFile);
      },
      Error,
      "Source and destination must not be the same."
    );
  }
});

test({
  name: "[fs] copy file",
  async fn(): Promise<void> {
    const srcFile = path.join(testdataDir, "copy_file.txt");
    const destFile = path.join(testdataDir, "copy_file_copy.txt");

    const srcContent = new TextDecoder().decode(await Deno.readFile(srcFile));

    assertEquals(
      await exists(srcFile),
      true,
      "src should be exist before copy"
    );
    assertEquals(
      await exists(destFile),
      false,
      "dest should not exist before copy"
    );

    await copy(srcFile, destFile);

    assertEquals(await exists(srcFile), true, "src should be exist after copy");
    assertEquals(
      await exists(destFile),
      true,
      "dest should be exist before copy"
    );

    const destContent = new TextDecoder().decode(await Deno.readFile(destFile));

    assertEquals(
      srcContent,
      destContent,
      "src and dest should have same content"
    );

    // copy again. it should throw a error
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

    // copy again with overwrite
    await copy(srcFile, destFile, { overwrite: true });

    // file have been overwrite
    assertEquals(
      new TextDecoder().decode(await Deno.readFile(destFile)),
      "txt"
    );

    await Deno.remove(destFile);
  }
});

test({
  name: "[fs] copy with preserve timestamps",
  async fn(): Promise<void> {
    const srcFile = path.join(testdataDir, "copy_file.txt");
    const destFile = path.join(testdataDir, "copy_file_copy.txt");

    const srcStatInfo = await Deno.stat(srcFile);

    assert(typeof srcStatInfo.accessed === "number");
    assert(typeof srcStatInfo.modified === "number");

    // overwrite and preserve timestamps
    await copy(srcFile, destFile, {
      overwrite: true,
      preserveTimestamps: true
    });

    const destStatInfo = await Deno.stat(destFile);

    assert(typeof destStatInfo.accessed === "number");
    assert(typeof destStatInfo.modified === "number");
    assertEquals(destStatInfo.accessed, srcStatInfo.accessed);
    assertEquals(destStatInfo.modified, srcStatInfo.modified);

    await Deno.remove(destFile);
  }
});

test({
  name: "[fs] copy directory from parent dir",
  async fn(): Promise<void> {
    const srcDir = path.join(testdataDir, "parent");
    const destDir = path.join(srcDir, "child");

    await ensureDir(srcDir);

    await assertThrowsAsync(
      async (): Promise<void> => {
        await copy(srcDir, destDir);
      },
      Error,
      `Cannot copy '${srcDir}' to a subdirectory of itself, '${destDir}'.`
    );

    await Deno.remove(srcDir, { recursive: true });
  }
});

test({
  name: "[fs] copy directory, and dest exist and not a directory",
  async fn(): Promise<void> {
    const srcDir = path.join(testdataDir, "parent");
    const destDir = path.join(testdataDir, "child.txt");

    await ensureDir(srcDir);
    await ensureFile(destDir);

    await assertThrowsAsync(
      async (): Promise<void> => {
        await copy(srcDir, destDir);
      },
      Error,
      `Cannot overwrite non-directory '${destDir}' with directory '${srcDir}'.`
    );

    await Deno.remove(srcDir, { recursive: true });
    await Deno.remove(destDir, { recursive: true });
  }
});

test({
  name: "[fs] copy directory",
  async fn(): Promise<void> {
    const srcDir = path.join(testdataDir, "copy_dir");
    const destDir = path.join(testdataDir, "copy_dir_copy");
    const srcFile = path.join(srcDir, "0.txt");
    const destFile = path.join(destDir, "0.txt");
    const srcNestFile = path.join(srcDir, "nest", "0.txt");
    const destNestFile = path.join(destDir, "nest", "0.txt");

    await copy(srcDir, destDir);

    assertEquals(await exists(destFile), true);
    assertEquals(await exists(destNestFile), true);

    // should have the same content
    assertEquals(
      new TextDecoder().decode(await Deno.readFile(srcFile)),
      new TextDecoder().decode(await Deno.readFile(destFile))
    );
    assertEquals(
      new TextDecoder().decode(await Deno.readFile(srcNestFile)),
      new TextDecoder().decode(await Deno.readFile(destNestFile))
    );

    // copy again. it should throw a error
    await assertThrowsAsync(
      async (): Promise<void> => {
        await copy(srcDir, destDir);
      },
      Error,
      `'${destDir}' already exists`
    );

    // update nest file
    await Deno.writeFile(destNestFile, new TextEncoder().encode("nest copy"));
    assertEquals(
      new TextDecoder().decode(await Deno.readFile(destNestFile)),
      "nest copy"
    );

    // copy again with overwrite
    await copy(srcDir, destDir, { overwrite: true });

    // nest file have been overwrite
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
    const dir = path.join(testdataDir, "copy_dir_link_file");
    const srcLink = path.join(dir, "0.txt"); // this is a file link
    const destLink = path.join(dir, "0-copy.txt"); // this is a file link

    if (isWindows) {
      await assertThrowsAsync(
        // (): Promise<void> => copy(srcLink, destLink),
        (): Promise<void> => ensureSymlink(srcLink, destLink),
        Error,
        "Not implemented"
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
  name: "[fs] copy symlink folder",
  async fn(): Promise<void> {
    const originDir = path.join(testdataDir, "copy_dir"); // origin dir
    const srcLink = path.join(testdataDir, "copy_dir_link"); // this is a dir link
    const destLink = path.join(testdataDir, "copy_dir_link_copy");

    if (isWindows) {
      await assertThrowsAsync(
        // (): Promise<void> => copy(srcLink, destLink),
        (): Promise<void> => ensureSymlink(srcLink, destLink),
        Error,
        "Not implemented"
      );
      return;
    }

    await ensureSymlink(originDir, srcLink);

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
  name: "[fs] copy file synchronously if it does no exist",
  fn(): void {
    const srcFile = path.join(testdataDir, "copy_file_not_exists_sync.txt");
    const destFile = path.join(testdataDir, "copy_file_not_exists_1_sync.txt");
    assertThrows(
      (): void => {
        copySync(srcFile, destFile);
      }
    );
  }
});

test({
  name: "[fs] copy with preserve timestamps",
  fn(): void {
    const srcFile = path.join(testdataDir, "copy_file.txt");
    const destFile = path.join(testdataDir, "copy_file_copy.txt");

    const srcStatInfo = Deno.statSync(srcFile);

    assert(typeof srcStatInfo.accessed === "number");
    assert(typeof srcStatInfo.modified === "number");

    // overwrite and preserve timestamps
    copySync(srcFile, destFile, {
      overwrite: true,
      preserveTimestamps: true
    });

    const destStatInfo = Deno.statSync(destFile);

    assert(typeof destStatInfo.accessed === "number");
    assert(typeof destStatInfo.modified === "number");
    assertEquals(destStatInfo.accessed, srcStatInfo.accessed);
    assertEquals(destStatInfo.modified, srcStatInfo.modified);

    Deno.removeSync(destFile);
  }
});

test({
  name: "[fs] copy synchronously if src and dest is same path",
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
    const srcFile = path.join(testdataDir, "copy_file.txt");
    const destFile = path.join(testdataDir, "copy_file_copy_sync.txt");

    const srcContent = new TextDecoder().decode(Deno.readFileSync(srcFile));

    assertEquals(existsSync(srcFile), true);
    assertEquals(existsSync(destFile), false);

    copySync(srcFile, destFile);

    assertEquals(existsSync(srcFile), true);
    assertEquals(existsSync(destFile), true);

    const destContent = new TextDecoder().decode(Deno.readFileSync(destFile));

    assertEquals(srcContent, destContent);

    // copy again. it should throw a error
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

    // copy again with overwrite
    copySync(srcFile, destFile, { overwrite: true });

    // file have been overwrite
    assertEquals(new TextDecoder().decode(Deno.readFileSync(destFile)), "txt");

    Deno.removeSync(destFile);
  }
});

test({
  name: "[fs] copy directory synchronously from parent dir",
  fn(): void {
    const srcDir = path.join(testdataDir, "parent_sync");
    const destDir = path.join(srcDir, "child");

    ensureDirSync(srcDir);

    assertThrows(
      (): void => {
        copySync(srcDir, destDir);
      },
      Error,
      `Cannot copy '${srcDir}' to a subdirectory of itself, '${destDir}'.`
    );

    Deno.removeSync(srcDir, { recursive: true });
  }
});

test({
  name: "[fs] copy directory synchronously, and dest exist and not a directory",
  fn(): void {
    const srcDir = path.join(testdataDir, "parent_sync");
    const destDir = path.join(testdataDir, "child.txt");

    ensureDirSync(srcDir);
    ensureFileSync(destDir);

    assertThrows(
      (): void => {
        copySync(srcDir, destDir);
      },
      Error,
      `Cannot overwrite non-directory '${destDir}' with directory '${srcDir}'.`
    );

    Deno.removeSync(srcDir, { recursive: true });
    Deno.removeSync(destDir, { recursive: true });
  }
});

test({
  name: "[fs] copy directory synchronously",
  fn(): void {
    const srcDir = path.join(testdataDir, "copy_dir");
    const destDir = path.join(testdataDir, "copy_dir_copy_sync");
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

    // copy again. it should throw a error
    assertThrows(
      (): void => {
        copySync(srcDir, destDir);
      },
      Error,
      `'${destDir}' already exists`
    );

    // update nest file
    Deno.writeFileSync(destNestFile, new TextEncoder().encode("nest copy"));
    assertEquals(
      new TextDecoder().decode(Deno.readFileSync(destNestFile)),
      "nest copy"
    );

    // copy again with overwrite
    copySync(srcDir, destDir, { overwrite: true });

    // nest file have been overwrite
    assertEquals(
      new TextDecoder().decode(Deno.readFileSync(destNestFile)),
      "nest"
    );

    Deno.removeSync(destDir, { recursive: true });
  }
});

test({
  name: "[fs] copy symlink file synchronously",
  fn(): void {
    const dir = path.join(testdataDir, "copy_dir_link_file");
    const srcLink = path.join(dir, "0.txt"); // this is a file link
    const destLink = path.join(dir, "0-copy.txt"); // this is a file link

    if (isWindows) {
      assertThrows(
        // (): void => copySync(srcLink, destLink),
        (): void => ensureSymlinkSync(srcLink, destLink),
        Error,
        "Not implemented"
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

    Deno.removeSync(destLink, { recursive: true });
  }
});

test({
  name: "[fs] copy symlink folder synchronously",
  fn(): void {
    const originDir = path.join(testdataDir, "copy_dir"); // origin dir
    const srcLink = path.join(testdataDir, "copy_dir_link"); // this is a dir link
    const destLink = path.join(testdataDir, "copy_dir_link_copy");

    if (isWindows) {
      assertThrows(
        // (): void => copySync(srcLink, destLink),
        (): void => ensureSymlinkSync(srcLink, destLink),
        Error,
        "Not implemented"
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

    Deno.removeSync(srcLink, { recursive: true });
    Deno.removeSync(destLink, { recursive: true });
  }
});
