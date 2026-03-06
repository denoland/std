// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertRejects, assertThrows } from "@std/assert";
import { makeTempDir, makeTempDirSync } from "./unstable_make_temp_dir.ts";
import { NotFound } from "./unstable_errors.js";
import { rmSync } from "node:fs";
import { rm } from "node:fs/promises";

Deno.test("makeTempDir() creates temporary directories in the default temp directory path", async () => {
  const dir1 = await makeTempDir({ prefix: "standard", suffix: "library" });
  const dir2 = await makeTempDir({ prefix: "standard", suffix: "library" });

  try {
    assert(dir1 !== dir2);

    for (const dir of [dir1, dir2]) {
      const tempDirName = dir.replace(/^.*[\\\/]/, "");
      assert(tempDirName.startsWith("standard"));
      assert(tempDirName.endsWith("library"));
    }
  } finally {
    await rm(dir1, { recursive: true, force: true });
    await rm(dir2, { recursive: true, force: true });
  }
});

Deno.test("makeTempDir() creates temporary directories with the 'dir' option", async () => {
  const tempParent = await makeTempDir({ prefix: "first", suffix: "last" });
  const dir = await makeTempDir({ dir: tempParent });

  try {
    assert(dir.startsWith(tempParent));
    assert(/^[\\\/]/.test(dir.slice(tempParent.length)));
  } finally {
    await rm(tempParent, { recursive: true, force: true });
  }
});

Deno.test("makeTempDir() rejects with NotFound when passing a 'dir' path that does not exist", async () => {
  await assertRejects(async () => {
    await makeTempDir({ dir: "/non-existent-dir" });
  }, NotFound);
});

Deno.test("makeTempDirSync() creates temporary directories in the default temp directory path", () => {
  const dir1 = makeTempDirSync({ prefix: "standard", suffix: "library" });
  const dir2 = makeTempDirSync({ prefix: "standard", suffix: "library" });

  try {
    assert(dir1 !== dir2);

    for (const dir of [dir1, dir2]) {
      const tempDirName = dir.replace(/^.*[\\\/]/, "");
      assert(tempDirName.startsWith("standard"));
      assert(tempDirName.endsWith("library"));
    }
  } finally {
    rmSync(dir1, { recursive: true, force: true });
    rmSync(dir2, { recursive: true, force: true });
  }
});

Deno.test("makeTempDirSync() creates temporary directories with the 'dir' option", () => {
  const tempParent = makeTempDirSync({ prefix: "first", suffix: "last" });
  const dir = makeTempDirSync({ dir: tempParent });

  try {
    assert(dir.startsWith(tempParent));
    assert(/^[\\\/]/.test(dir.slice(tempParent.length)));
  } finally {
    rmSync(tempParent, { recursive: true, force: true });
  }
});

Deno.test("makeTempDirSync() throws with NotFound when passing a 'dir' path that does not exist", () => {
  assertThrows(() => {
    makeTempDirSync({ dir: "/non-existent-dir" });
  }, NotFound);
});
