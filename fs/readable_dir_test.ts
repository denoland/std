// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { readableDir, readableDirSync } from "./readable_dir.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("[fs] readableFile", async function () {
  assertEquals(
    await readableDir(path.join(testdataDir, "not_exist_file.ts")),
    false,
  );
  assertEquals(await readableDir(path.join(testdataDir, "0.ts")), false);
});

Deno.test("[fs] readableFileSync", function () {
  assertEquals(readableDirSync(path.join(testdataDir, "not_exist_file.ts")), false);
  assertEquals(readableDirSync(path.join(testdataDir, "0.ts")), false);
});

Deno.test("[fs] readableDir", async function () {
  assertEquals(
    await readableDir(path.join(testdataDir, "not_exist_directory")),
    false,
  );
  assertEquals(await readableDir(testdataDir), true);
});

Deno.test("[fs] readableDirSync", function () {
  assertEquals(
    readableDirSync(path.join(testdataDir, "not_exist_directory")),
    false,
  );
  assertEquals(readableDirSync(testdataDir), true);
});

Deno.test("[fs] readableFileLink", async function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(await readableDir(path.join(testdataDir, "0-link")), false);
});

Deno.test("[fs] readableFileLinkSync", function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(readableDirSync(path.join(testdataDir, "0-link")), false);
});

Deno.test("[fs] readableDirLink", async function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(await readableDir(path.join(testdataDir, "testdata-link")), true);
});

Deno.test("[fs] readableDirLinkSync", function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(readableDirSync(path.join(testdataDir, "testdata-link")), true);
});

