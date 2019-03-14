// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import {
  assertEquals,
  assertThrows,
  assertThrowsAsync
} from "../testing/asserts.ts";
import { copy, copySync } from "./copy.ts";
import { exists, existsSync } from "./exists.ts";
import * as path from "./path/mod.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { ensureFile, ensureFileSync } from "./ensure_file.ts";

const testdataDir = path.resolve("fs", "testdata");

test(async function copyIfNotExists() {
  const srcFile = path.join(testdataDir, "copy_file_not_exists.txt");
  const destFile = path.join(testdataDir, "copy_file_not_exists_1.txt");
  await assertThrowsAsync(async () => {
    await copy(srcFile, destFile);
  });
});

test(async function copyIfNotExists() {
  const srcFile = path.join(testdataDir, "copy_file_same.txt");
  await assertThrowsAsync(
    async () => {
      await copy(srcFile, srcFile);
    },
    Error,
    "Source and destination must not be the same."
  );
});

test(async function copyFile() {
  const srcFile = path.join(testdataDir, "copy_file.txt");
  const destFile = path.join(testdataDir, "copy_file_copy.txt");

  const srcContent = new TextDecoder().decode(await Deno.readFile(srcFile));

  assertEquals(await exists(srcFile), true);
  assertEquals(await exists(destFile), false);

  await copy(srcFile, destFile);

  assertEquals(await exists(srcFile), true);
  assertEquals(await exists(destFile), true);

  const destContent = new TextDecoder().decode(await Deno.readFile(destFile));

  assertEquals(srcContent, destContent);

  // copy again. it should throw a error
  await assertThrowsAsync(
    async () => {
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
  assertEquals(new TextDecoder().decode(await Deno.readFile(destFile)), "txt");

  await Deno.remove(destFile);
});

test(async function copyDirectoryFromParentDir() {
  const srcDir = path.join(testdataDir, "parent");
  const destDir = path.join(srcDir, "child");

  await ensureDir(srcDir);

  await assertThrowsAsync(
    async () => {
      await copy(srcDir, destDir);
    },
    Error,
    `Cannot copy '${srcDir}' to a subdirectory of itself, '${destDir}'.`
  );

  await Deno.remove(srcDir, { recursive: true });
});

test(async function copyDirectoryDestNotIsDir() {
  const srcDir = path.join(testdataDir, "parent");
  const destDir = path.join(testdataDir, "child.txt");

  await ensureDir(srcDir);
  await ensureFile(destDir);

  await assertThrowsAsync(
    async () => {
      await copy(srcDir, destDir);
    },
    Error,
    `Cannot overwrite non-directory '${destDir}' with directory '${srcDir}'.`
  );

  await Deno.remove(srcDir, { recursive: true });
  await Deno.remove(destDir, { recursive: true });
});

test(async function copyDirectory() {
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
    async () => {
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
});

test(function copySyncIfNotExists() {
  const srcFile = path.join(testdataDir, "copy_file_not_exists_sync.txt");
  const destFile = path.join(testdataDir, "copy_file_not_exists_1_sync.txt");
  assertThrows(() => {
    copySync(srcFile, destFile);
  });
});

test(function copySyncIfNotExists() {
  const srcFile = path.join(testdataDir, "copy_file_same_sync.txt");
  assertThrows(
    () => {
      copySync(srcFile, srcFile);
    },
    Error,
    "Source and destination must not be the same."
  );
});

test(function copySyncFile() {
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
    () => {
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
});

test(function copySyncDirectoryFromParentDir() {
  const srcDir = path.join(testdataDir, "parent_sync");
  const destDir = path.join(srcDir, "child");

  ensureDirSync(srcDir);

  assertThrows(
    () => {
      copySync(srcDir, destDir);
    },
    Error,
    `Cannot copy '${srcDir}' to a subdirectory of itself, '${destDir}'.`
  );

  Deno.removeSync(srcDir, { recursive: true });
});

test(function copySyncDirectoryDestNotIsDir() {
  const srcDir = path.join(testdataDir, "parent_sync");
  const destDir = path.join(testdataDir, "child.txt");

  ensureDirSync(srcDir);
  ensureFileSync(destDir);

  assertThrows(
    () => {
      copySync(srcDir, destDir);
    },
    Error,
    `Cannot overwrite non-directory '${destDir}' with directory '${srcDir}'.`
  );

  Deno.removeSync(srcDir, { recursive: true });
  Deno.removeSync(destDir, { recursive: true });
});

test(function copySyncDirectory() {
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
    () => {
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
});
