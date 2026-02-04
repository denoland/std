// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertMatch, assertRejects, assertThrows } from "@std/assert";
import { realPath, realPathSync } from "./unstable_real_path.ts";
import { NotFound } from "./unstable_errors.js";
import { platform } from "node:os";

Deno.test("realPath() returns the absolute path from a relative file path", async () => {
  const testFileRelative = "fs/testdata/0.ts";
  const testFileReal = await realPath(testFileRelative);
  if (platform() === "win32") {
    assertMatch(testFileReal, /^[A-Z]:\\/);
    assert(testFileReal.endsWith(testFileRelative.replace(/\//g, "\\")));
  } else {
    assert(testFileReal.startsWith("/"));
    assert(testFileReal.endsWith(testFileRelative));
  }
});

Deno.test("realPath() returns the absolute path of the linked file via symlink", async () => {
  // `fs/testdata/0-link` is symlinked to file `fs/testdata/0.ts`.
  const testFileSymlink = "fs/testdata/0-link";
  const testFileReal = await realPath(testFileSymlink);
  if (platform() === "win32") {
    assertMatch(testFileReal, /^[A-Z]:\\/);
    assert(testFileReal.endsWith("/testdata/0.ts".replace(/\//g, "\\")));
  } else {
    assert(testFileReal.startsWith("/"));
    assert(testFileReal.endsWith("fs/testdata/0.ts"));
  }
});

Deno.test("realPath() rejects with NotFound for a non-existent file", async () => {
  await assertRejects(async () => {
    await realPath("non-existent-file.txt");
  }, NotFound);
});

Deno.test("realPathSync() returns the absolute path of a relative file", () => {
  const testFileRelative = "fs/testdata/0.ts";
  const testFileReal = realPathSync(testFileRelative);
  if (platform() === "win32") {
    assertMatch(testFileReal, /^[A-Z]:\\/);
    assert(testFileReal.endsWith(testFileRelative.replace(/\//g, "\\")));
  } else {
    assert(testFileReal.startsWith("/"));
    assert(testFileReal.endsWith(testFileRelative));
  }
});

Deno.test("realPathSync() returns the absolute path of the linked file via symlink", () => {
  // `fs/testdata/0-link` is symlinked to file `fs/testdata/0.ts`.
  const testFileSymlink = "fs/testdata/0-link";
  const testFileReal = realPathSync(testFileSymlink);
  if (platform() === "win32") {
    assertMatch(testFileReal, /^[A-Z]:\\/);
    assert(testFileReal.endsWith("/testdata/0.ts".replace(/\//g, "\\")));
  } else {
    assert(testFileReal.startsWith("/"));
    assert(testFileReal.endsWith("/testdata/0.ts"));
  }
});

Deno.test("realPathSync() throws with NotFound for a non-existent file", () => {
  assertThrows(() => {
    realPathSync("non-existent-file.txt");
  }, NotFound);
});
