// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertRejects, assertThrows } from "@std/assert";
import { rm, stat, writeFile } from "node:fs/promises";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { copyFile, copyFileSync } from "./unstable_copy_file.ts";
import { makeTempDir, makeTempDirSync } from "./unstable_make_temp_dir.ts";
import { readTextFile, readTextFileSync } from "./unstable_read_text_file.ts";

Deno.test("copyFile() copies content to an existed file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "copy_file_async_" });
  const source = join(tempDirPath, "source.txt");
  const target = join(tempDirPath, "target.txt");

  const content = "This is written by `copyFile` API";

  await writeFile(source, content);
  await writeFile(target, "");
  await copyFile(source, target);

  try {
    const targetContent = await readTextFile(target);
    assert(content === targetContent);
  } finally {
    await rm(tempDirPath, { recursive: true, force: true });
  }
});

Deno.test("copyFile() copies content to a directory, which will throw an error", async () => {
  const tempDirPath = await makeTempDir({ prefix: "copy_file_async_" });
  const source = join(tempDirPath, "source.txt");

  const content = "This is written by `copyFile` API";

  await writeFile(source, content);

  try {
    await assertRejects(async () => {
      await copyFile(source, tmpdir());
    });
  } finally {
    await rm(tempDirPath, { recursive: true, force: true });
  }
});

Deno.test(
  "copyFile() copies content to a non existed file",
  async () => {
    const tempDirPath = await makeTempDir({ prefix: "copy_file_async_" });
    const source = join(tempDirPath, "source.txt");
    const target = join(tempDirPath, "target.txt");

    const content = "This is written by `copyFile` API";

    await writeFile(source, content);
    await copyFile(source, target);

    const fileInfo = await stat(target);
    const targetContent = await readTextFile(target);

    try {
      assert(fileInfo.isFile());
      assert(content === targetContent);
    } finally {
      await rm(tempDirPath, { recursive: true, force: true });
    }
  },
);

Deno.test("copyFileSync() copies content to an existed file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "copy_file_sync_" });
  const source = join(tempDirPath, "source.txt");
  const target = join(tempDirPath, "target.txt");

  const content = "This is written by `copyFileSync` API";

  writeFileSync(source, content);
  writeFileSync(target, "");
  copyFileSync(source, target);

  const targetContent = readTextFileSync(target);
  assert(content === targetContent);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("copyFileSync() copies content to a directory, which will throw an error", () => {
  const tempDirPath = makeTempDirSync({ prefix: "copy_file_sync_" });
  const source = join(tempDirPath, "source.txt");

  const content = "This is written by `copyFile` API";

  writeFileSync(source, content);

  try {
    assertThrows(() => {
      copyFileSync(source, tmpdir());
    });
  } finally {
    rmSync(tempDirPath, { recursive: true, force: true });
  }
});

Deno.test("copyFileSync() copies content to a non existed file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "copy_file_sync_" });
  const source = join(tempDirPath, "source.txt");
  const target = join(tempDirPath, "target.txt");

  const content = "This is written by `copyFileSync` API";

  writeFileSync(source, content);
  copyFileSync(source, target);

  const targetIsExists = existsSync(target);
  const targetContent = readTextFileSync(target);

  assert(targetIsExists);
  assert(content === targetContent);

  rmSync(tempDirPath, { recursive: true, force: true });
});
