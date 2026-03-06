// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals, assertRejects, assertThrows } from "@std/assert";
import { create, createSync } from "./unstable_create.ts";
import { makeTempDir, makeTempDirSync } from "./unstable_make_temp_dir.ts";
import { makeTempFile, makeTempFileSync } from "./unstable_make_temp_file.ts";
import { stat, statSync } from "./unstable_stat.ts";
import {
  writeTextFile,
  writeTextFileSync,
} from "./unstable_write_text_file.ts";
import { remove, removeSync } from "./unstable_remove.ts";
import { join } from "node:path";

Deno.test("create() creates a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "create_" });
  const testFile = join(tempDirPath, "createFile.txt");

  const fh = await create(testFile);

  let fileStat = await fh.stat();
  assert(fileStat.isFile);
  assertEquals(fileStat.size, 0);

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello, Standard Library");
  await fh.write(data);

  fileStat = await fh.stat();
  assertEquals(fileStat.size, 23);

  fh.close();
  await remove(tempDirPath, { recursive: true });
});

Deno.test("create() truncates an existing file path", async () => {
  const tempFile = await makeTempFile({ prefix: "create_" });
  await writeTextFile(tempFile, "Hello, Standard Library");

  const fh = await create(tempFile);

  const fileStat = await stat(tempFile);
  assertEquals(fileStat.size, 0);

  fh.close();
  await remove(tempFile);
});

Deno.test("create() rejects with Error when using a file path that is not a regular file", async () => {
  const tempDir = await makeTempDir({ prefix: "create_" });

  await assertRejects(async () => {
    await create(tempDir);
  }, Error);

  await remove(tempDir);
});

Deno.test("createSync() creates a new file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "createSync_" });
  const testFile = join(tempDirPath, "createFile.txt");

  const fh = createSync(testFile);

  let fileStat = fh.statSync();
  assert(fileStat.isFile);
  assertEquals(fileStat.size, 0);

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello, Standard Library");
  fh.writeSync(data);

  fileStat = fh.statSync();
  assertEquals(fileStat.size, 23);

  fh.close();
  removeSync(tempDirPath, { recursive: true });
});

Deno.test("createSync() truncates an existing file path", () => {
  const tempFile = makeTempFileSync({ prefix: "createSync_ " });
  writeTextFileSync(tempFile, "Hello, Standard Library");

  const fh = createSync(tempFile);

  const fileStat = statSync(tempFile);
  assertEquals(fileStat.size, 0);

  fh.close();
  removeSync(tempFile);
});

Deno.test("createSync() throws with Error when using a file path that is not a regular file", () => {
  const tempDir = makeTempDirSync({ prefix: "createSync_" });

  assertThrows(() => {
    createSync(tempDir);
  }, Error);

  removeSync(tempDir);
});
