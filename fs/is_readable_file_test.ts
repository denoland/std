// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { isReadableFile, isReadableFileSync } from "./is_readable_file.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("[fs] isReadableFile", async function () {
  assertEquals(
    await isReadableFile(path.join(testdataDir, "not_exist_file.ts")),
    false,
  );
  assertEquals(await isReadableFile(path.join(testdataDir, "0.ts")), true);
});

Deno.test("[fs] isReadableFileSync", function () {
  assertEquals(
    isReadableFileSync(path.join(testdataDir, "not_exist_file.ts")),
    false,
  );
  assertEquals(isReadableFileSync(path.join(testdataDir, "0.ts")), true);
});

Deno.test("[fs] isReadableDir", async function () {
  assertEquals(
    await isReadableFile(path.join(testdataDir, "not_exist_directory")),
    false,
  );
  assertEquals(await isReadableFile(testdataDir), false);
});

Deno.test("[fs] isReadableDirSync", function () {
  assertEquals(
    isReadableFileSync(path.join(testdataDir, "not_exist_directory")),
    false,
  );
  assertEquals(isReadableFileSync(testdataDir), false);
});

Deno.test("[fs] isReadableFileLink", async function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(await isReadableFile(path.join(testdataDir, "0-link")), true);
});

Deno.test("[fs] isReadableFileLinkSync", function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(isReadableFileSync(path.join(testdataDir, "0-link")), true);
});

Deno.test("[fs] isReadableDirLink", async function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(
    await isReadableFile(path.join(testdataDir, "testdata-link")),
    false,
  );
});

Deno.test("[fs] isReadableDirLinkSync", function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(
    isReadableFileSync(path.join(testdataDir, "testdata-link")),
    false,
  );
});
