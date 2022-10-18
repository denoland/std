// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { readableFile, readableFileSync } from "./readable_file.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("[fs] readableFile", async function () {
  assertEquals(
    await readableFile(path.join(testdataDir, "not_exist_file.ts")),
    false,
  );
  assertEquals(await readableFile(path.join(testdataDir, "0.ts")), true);
});

Deno.test("[fs] readableFileSync", function () {
  assertEquals(readableFileSync(path.join(testdataDir, "not_exist_file.ts")), false);
  assertEquals(readableFileSync(path.join(testdataDir, "0.ts")), true);
});

Deno.test("[fs] readableDir", async function () {
  assertEquals(
    await readableFile(path.join(testdataDir, "not_exist_directory")),
    false,
  );
  assertEquals(await readableFile(testdataDir), false);
});

Deno.test("[fs] readableDirSync", function () {
  assertEquals(
    readableFileSync(path.join(testdataDir, "not_exist_directory")),
    false,
  );
  assertEquals(readableFileSync(testdataDir), false);
});

Deno.test("[fs] readableFileLink", async function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(await readableFile(path.join(testdataDir, "0-link")), true);
});

Deno.test("[fs] readableFileLinkSync", function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(readableFileSync(path.join(testdataDir, "0-link")), true);
});

Deno.test("[fs] readableDirLink", async function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(await readableFile(path.join(testdataDir, "testdata-link")), false);
});

Deno.test("[fs] readableDirLinkSync", function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(readableFileSync(path.join(testdataDir, "testdata-link")), false);
});

