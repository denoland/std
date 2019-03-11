// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { pathExists, pathExistsSync } from "./path_exists.ts";
import * as path from "./path/mod.ts";

const testdataDir = path.resolve("fs", "testdata");

test(async function pathExistFile() {
  assertEquals(
    await pathExists(path.join(testdataDir, "not_exist_file.ts")),
    false
  );
  assertEquals(await pathExistsSync(path.join(testdataDir, "0.ts")), true);
});

test(function pathExistFileSync() {
  assertEquals(
    pathExistsSync(path.join(testdataDir, "not_exist_file.ts")),
    false
  );
  assertEquals(pathExistsSync(path.join(testdataDir, "0.ts")), true);
});

test(async function pathExistDirectory() {
  assertEquals(
    await pathExists(path.join(testdataDir, "not_exist_directory")),
    false
  );
  assertEquals(pathExistsSync(testdataDir), true);
});

test(function pathExistDirectorySync() {
  assertEquals(
    pathExistsSync(path.join(testdataDir, "not_exist_directory")),
    false
  );
  assertEquals(pathExistsSync(testdataDir), true);
});
