// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { isReadableDir, isReadableDirSync } from "./is_readable_dir.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("[fs] isReadableFile", async function () {
  assertEquals(
    await isReadableDir(path.join(testdataDir, "not_exist_file.ts")),
    false,
  );
  assertEquals(await isReadableDir(path.join(testdataDir, "0.ts")), false);
});

Deno.test("[fs] isReadableFileSync", function () {
  assertEquals(
    isReadableDirSync(path.join(testdataDir, "not_exist_file.ts")),
    false,
  );
  assertEquals(isReadableDirSync(path.join(testdataDir, "0.ts")), false);
});

Deno.test("[fs] isReadableDir", async function () {
  assertEquals(
    await isReadableDir(path.join(testdataDir, "not_exist_directory")),
    false,
  );
  assertEquals(await isReadableDir(testdataDir), true);
});

Deno.test("[fs] isReadableDirSync", function () {
  assertEquals(
    isReadableDirSync(path.join(testdataDir, "not_exist_directory")),
    false,
  );
  assertEquals(isReadableDirSync(testdataDir), true);
});

Deno.test("[fs] isReadableFileLink", async function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(await isReadableDir(path.join(testdataDir, "0-link")), false);
});

Deno.test("[fs] isReadableFileLinkSync", function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(isReadableDirSync(path.join(testdataDir, "0-link")), false);
});

Deno.test("[fs] isReadableDirLink", async function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(
    await isReadableDir(path.join(testdataDir, "testdata-link")),
    true,
  );
});

Deno.test("[fs] isReadableDirLinkSync", function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(
    isReadableDirSync(path.join(testdataDir, "testdata-link")),
    true,
  );
});
