// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { isReadable, isReadableSync } from "./is_readable.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("[fs] isReadableFile", async function () {
  assertEquals(
    await isReadable(path.join(testdataDir, "not_exist_file.ts")),
    false,
  );
  assertEquals(await isReadable(path.join(testdataDir, "0.ts")), true);
});

Deno.test("[fs] isReadableFileSync", function () {
  assertEquals(
    isReadableSync(path.join(testdataDir, "not_exist_file.ts")),
    false,
  );
  assertEquals(isReadableSync(path.join(testdataDir, "0.ts")), true);
});

Deno.test("[fs] isReadableDir", async function () {
  assertEquals(
    await isReadable(path.join(testdataDir, "not_exist_directory")),
    false,
  );
  assertEquals(await isReadable(testdataDir), true);
});

Deno.test("[fs] isReadableDirSync", function () {
  assertEquals(
    isReadableSync(path.join(testdataDir, "not_exist_directory")),
    false,
  );
  assertEquals(isReadableSync(testdataDir), true);
});

Deno.test("[fs] isReadableFileLink", async function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(await isReadable(path.join(testdataDir, "0-link")), true);
});

Deno.test("[fs] isReadableFileLinkSync", function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(isReadableSync(path.join(testdataDir, "0-link")), true);
});

Deno.test("[fs] isReadableDirLink", async function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(await isReadable(path.join(testdataDir, "testdata-link")), true);
});

Deno.test("[fs] isReadableDirLinkSync", function () {
  // TODO(axetroy): generate link file use Deno api instead of set a link file
  // in repository
  assertEquals(isReadableSync(path.join(testdataDir, "testdata-link")), true);
});
