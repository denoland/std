// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertRejects, assertThrows } from "@std/assert";
import { makeTempFile, makeTempFileSync } from "./unstable_make_temp_file.ts";
import { NotFound } from "./unstable_errors.js";
import { makeTempDir, makeTempDirSync } from "./unstable_make_temp_dir.ts";
import { remove, removeSync } from "./unstable_remove.ts";

Deno.test("makeTempFile() creates temporary files in the default temp directory path", async () => {
  const tempFile1 = await makeTempFile({
    prefix: "standard",
    suffix: "library",
  });
  const tempFile2 = await makeTempFile({
    prefix: "standard",
    suffix: "library",
  });

  try {
    assert(tempFile1 !== tempFile2);

    for (const file of [tempFile1, tempFile2]) {
      const tempFileName = file.replace(/^.*[\\\/]/, "");
      assert(tempFileName.startsWith("standard"));
      assert(tempFileName.endsWith("library"));
    }
  } finally {
    await remove(tempFile1);
    await remove(tempFile2);
  }
});

Deno.test("makeTempFile() creates temporary files in the 'dir' option", async () => {
  const tempDirPath = await makeTempDir({ prefix: "makeTempFile_" });
  const tempFile = await makeTempFile({ dir: tempDirPath });

  try {
    assert(tempFile.startsWith(tempDirPath));
    assert(/^[\\\/]/.test(tempFile.slice(tempDirPath.length)));
  } finally {
    await remove(tempDirPath, { recursive: true });
  }
});

Deno.test("makeTempFile() rejects with NotFound when passing a 'dir' path that does not exist", async () => {
  await assertRejects(async () => {
    await makeTempFile({ dir: "/non-existent-dir" });
  }, NotFound);
});

Deno.test("makeTempFileSync() creates temporary files in the default temp directory path", () => {
  const tempFile1 = makeTempFileSync({ prefix: "standard", suffix: "library" });
  const tempFile2 = makeTempFileSync({ prefix: "standard", suffix: "library" });

  try {
    assert(tempFile1 !== tempFile2);

    for (const file of [tempFile1, tempFile2]) {
      const tempFileName = file.replace(/^.*[\\\/]/, "");
      assert(tempFileName.startsWith("standard"));
      assert(tempFileName.endsWith("library"));
    }
  } finally {
    removeSync(tempFile1);
    removeSync(tempFile2);
  }
});

Deno.test("makeTempFileSync() creates temporary files in the 'dir' option", () => {
  const tempDirPath = makeTempDirSync({ prefix: "makeTempFileSync_" });
  const tempFile = makeTempFileSync({ dir: tempDirPath });

  try {
    assert(tempFile.startsWith(tempDirPath));
    assert(/^[\\\/]/.test(tempFile.slice(tempDirPath.length)));
  } finally {
    removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("makeTempFileSync() throws with NotFound when passing a 'dir' path that does not exist", () => {
  assertThrows(() => {
    makeTempFileSync({ dir: "/non-existent-dir" });
  }, NotFound);
});
