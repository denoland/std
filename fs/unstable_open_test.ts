// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { AlreadyExists, NotFound } from "./unstable_errors.js";
import { open, openSync } from "./unstable_open.ts";
import { makeTempDir, makeTempDirSync } from "./unstable_make_temp_dir.ts";
import { makeTempFile, makeTempFileSync } from "./unstable_make_temp_file.ts";
import { remove, removeSync } from "./unstable_remove.ts";
import { platform } from "node:os";
import { join } from "node:path";
import { umask } from "node:process";

Deno.test("open() handles 'createNew' when opening a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "open_" });
  const testFile = join(tempDirPath, "testFile.txt");

  // Errors if 'write' or 'append' is not provided.
  await assertRejects(async () => {
    const _fh = await open(testFile, { createNew: true });
  }, Error);

  // Creates a new file successfully.
  let fh = await open(testFile, { write: true, createNew: true });
  const encoder = new TextEncoder();
  const data = encoder.encode("Hello, Standard Library");
  await fh.write(data);
  fh.close();

  // Errors if the file already exists.
  await assertRejects(async () => {
    fh = await open(testFile, { write: true, createNew: true });
  }, AlreadyExists);

  await remove(tempDirPath, { recursive: true });
});

Deno.test("open() handles 'create' when opening a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "open_ " });
  const testFile = join(tempDirPath, "testFile.txt");

  // Rejects with Error if 'write' or 'append' is not provided.
  await assertRejects(async () => {
    const _fh = await open(testFile, { create: true });
  }, Error);

  const encoder = new TextEncoder();
  const writeData = encoder.encode("Hi, Standard Library");

  // Rejects with Error if 'create' is false and file does not exist.
  await assertRejects(async () => {
    const _fh = await open(testFile, { create: false, write: true });
  }, NotFound);

  // Creates a file successfully.
  let fh = await open(testFile, { create: true, write: true });
  await fh.write(writeData);
  fh.close();

  // Overwrites existing content with new content.
  fh = await open(testFile, { create: false, write: true });
  const overwriteData = encoder.encode("Hello, Standard Library");
  await fh.write(overwriteData);
  fh.close();

  // Verify overwrite.
  fh = await open(testFile);
  const readBuf = new Uint8Array(23);
  await fh.read(readBuf);
  fh.close();

  const decoder = new TextDecoder("utf-8");
  assertEquals(decoder.decode(readBuf), "Hello, Standard Library");

  await remove(tempDirPath, { recursive: true });
});

Deno.test("open() handles 'append' when opening a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "open_" });
  const testFile = join(tempDirPath, "testFile.txt");

  // Rejects with Error when 'append' is false to create a new file.
  await assertRejects(async () => {
    const _fh = await open(testFile, { create: true, append: false });
  }, Error);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Creates a new file with 'append'.
  let fh = await open(testFile, { create: true, append: true });
  const data = encoder.encode("Hello");
  await fh.write(data);
  fh.close();

  // Append to the same file.
  fh = await open(testFile, { write: true, append: true });
  const appendData = encoder.encode(", Standard Library");
  await fh.write(appendData);
  fh.close();

  // Append to the same file with only 'append'.
  fh = await open(testFile, { append: true });
  const moreAppendData = encoder.encode("!");
  await fh.write(moreAppendData);
  fh.close();

  // Read back data.
  fh = await open(testFile);
  const buf = new Uint8Array(24);
  await fh.read(buf);
  assertEquals(decoder.decode(buf), "Hello, Standard Library!");
  fh.close();

  await remove(tempDirPath, { recursive: true });
});

Deno.test("open() handles 'truncate' when opening a file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "open_" });
  const testFile = join(tempDirPath, "testFile.txt");

  let fh = await open(testFile, { create: true, write: true });
  const encoder = new TextEncoder();
  await fh.write(encoder.encode("Hello"));
  fh.close();

  // Errors when specifying 'truncate' without 'write' or 'append'.
  await assertRejects(async () => {
    const _fh = await open(testFile, { truncate: true });
  }, Error);

  // Truncates the file successfully.
  fh = await open(testFile, { truncate: true, write: true });
  fh.close();

  // Read back data.
  fh = await open(testFile);
  const buf = new Uint8Array(10);
  const bytesRead = await fh.read(buf);
  fh.close();
  assertEquals(bytesRead, null);

  await remove(tempDirPath, { recursive: true });
});

Deno.test({
  name: "open() opens files with a user-defined mode prior to applying umask",
  ignore: platform() === "win32",
  fn: async () => {
    const tempDirPath = makeTempDirSync({ prefix: "open_" });
    const testFile = join(tempDirPath, "testFile.txt");

    let fh = await open(testFile, {
      mode: 0o624,
      createNew: true,
      write: true,
    });
    let fhStats = await fh.stat();
    fh.close();
    assertEquals(fhStats.mode! & 0o777, 0o624 & ~umask(0o022));

    // Opening the same file under a different mode should not change the
    // current file mode.
    fh = await open(testFile, { mode: 0o777, write: true });
    fhStats = await fh.stat();
    fh.close();
    assertEquals(fhStats.mode! & 0o777, 0o624 & ~umask(0o022));

    await remove(tempDirPath, { recursive: true });
  },
});

Deno.test("open() rejects with Error when all options are false", async () => {
  await assertRejects(async () => {
    const _fh = await open("./notAFile.txt", { read: false });
  }, Error);
});

Deno.test("open() rejects with TypeError when trying to 'truncate' and 'append' opening a file", async () => {
  const tempFile = await makeTempFile({ prefix: "open_" });

  await assertRejects(async () => {
    const _fh = await open(tempFile, {
      write: true,
      append: true,
      truncate: true,
    });
  }, TypeError);

  await remove(tempFile);
});

Deno.test("open() rejects with NotFound when opening to read a non-existent file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "open_" });
  const notAFile = join(tempDirPath, "non_existent.txt");

  await assertRejects(async () => {
    const _fh = await open(notAFile);
  }, NotFound);

  await remove(tempDirPath, { recursive: true });
});

Deno.test("open() rejects with Error when opening a non-existent directory", async () => {
  const tempDirPath = await makeTempDir({ prefix: "open_" });
  const testDir = join(tempDirPath, "testDir");

  await assertRejects(async () => {
    const _fh = await open(testDir);
  }, Error);

  await remove(tempDirPath, { recursive: true });
});

Deno.test("openSync() handles 'createNew' when opening a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "openSync_" });
  const testFile = join(tempDirPath, "testFile.txt");

  // Errors if 'write' or 'append' is not provided.
  assertThrows(() => {
    const _fh = openSync(testFile, { createNew: true });
  }, Error);

  // Creates a new file successfully.
  let fh = openSync(testFile, { write: true, createNew: true });
  const encoder = new TextEncoder();
  const data = encoder.encode("Hello, Standard Library");
  fh.writeSync(data);
  fh.close();

  // Errors if the file already exists.
  assertThrows(() => {
    fh = openSync(testFile, { write: true, createNew: true });
  }, AlreadyExists);

  removeSync(tempDirPath, { recursive: true });
});

Deno.test("openSync() handles 'create' when opening a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "openSync_" });
  const testFile = join(tempDirPath, "testFile.txt");

  // Throws with Error if 'write' or 'append' is not provided.
  assertThrows(() => {
    const _fh = openSync(testFile, { create: true });
  }, Error);

  const encoder = new TextEncoder();
  const writeData = encoder.encode("Hi, Standard Library");

  // Throws with Error if 'create' is false and file does not exist.
  assertThrows(() => {
    const _fh = openSync(testFile, { create: false, write: true });
  }, NotFound);

  // Creates a file successfully.
  let fh = openSync(testFile, { create: true, write: true });
  fh.writeSync(writeData);
  fh.close();

  // Overwrites existing content with new content.
  fh = openSync(testFile, { create: false, write: true });
  const overwriteData = encoder.encode("Hello, Standard Library");
  fh.writeSync(overwriteData);
  fh.close();

  // Verify overwrite.
  fh = openSync(testFile);
  const readBuf = new Uint8Array(23);
  fh.readSync(readBuf);
  fh.close();

  const decoder = new TextDecoder("utf-8");
  assertEquals(decoder.decode(readBuf), "Hello, Standard Library");

  removeSync(tempDirPath, { recursive: true });
});

Deno.test("openSync() handles 'append' when opening a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "openSync_ " });
  const testFile = join(tempDirPath, "testFile.txt");

  // Throws with Error when 'append' is false to create a new file.
  assertThrows(() => {
    const _fh = openSync(testFile, { create: true, append: false });
  }, Error);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Creates a new file with 'append'.
  let fh = openSync(testFile, { create: true, append: true });
  const data = encoder.encode("Hello");
  fh.writeSync(data);
  fh.close();

  // Append to the same file.
  fh = openSync(testFile, { write: true, append: true });
  const appendData = encoder.encode(", Standard Library");
  fh.writeSync(appendData);
  fh.close();

  // Append to the same file with only 'append'.
  fh = openSync(testFile, { append: true });
  const moreAppendData = encoder.encode("!");
  fh.writeSync(moreAppendData);
  fh.close();

  // Read back data.
  fh = openSync(testFile);
  const buf = new Uint8Array(24);
  fh.readSync(buf);
  assertEquals(decoder.decode(buf), "Hello, Standard Library!");
  fh.close();

  removeSync(tempDirPath, { recursive: true });
});

Deno.test("openSync() handles 'truncate' when opening a file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "openSync_" });
  const testFile = join(tempDirPath, "testFile.txt");

  let fh = openSync(testFile, { create: true, write: true });
  const encoder = new TextEncoder();
  fh.writeSync(encoder.encode("Hello"));
  fh.close();

  // Errors when specifying 'truncate' without 'write' or 'append'.
  assertThrows(() => {
    const _fh = openSync(testFile, { truncate: true });
  }, Error);

  // Truncates the file successfully.
  fh = openSync(testFile, { truncate: true, write: true });
  fh.close();

  // Read back data.
  fh = openSync(testFile);
  const buf = new Uint8Array(10);
  const bytesRead = fh.readSync(buf);
  fh.close();
  assertEquals(bytesRead, null);

  removeSync(tempDirPath, { recursive: true });
});

Deno.test({
  name:
    "openSync() opens files with a user-defined mode prior to applying umask",
  ignore: platform() === "win32",
  fn: () => {
    const tempDirPath = makeTempDirSync({ prefix: "openSync_" });
    const testFile = join(tempDirPath, "testFile.txt");

    let fh = openSync(testFile, { mode: 0o624, createNew: true, write: true });
    let fhStats = fh.statSync();
    fh.close();
    assertEquals(fhStats.mode! & 0o777, 0o624 & ~umask(0o022));

    // Opening the same file under a different mode should not change the
    // current file mode.
    fh = openSync(testFile, { mode: 0o777, write: true });
    fhStats = fh.statSync();
    fh.close();
    assertEquals(fhStats.mode! & 0o777, 0o624 & ~umask(0o022));

    removeSync(tempDirPath, { recursive: true });
  },
});

Deno.test("openSync() throws with Error when all options are false", () => {
  assertThrows(() => {
    const _fh = openSync("./notAFile.txt", { read: false });
  }, Error);
});

Deno.test("openSync() throws with TypeError when trying to 'truncate' and 'append' opening a file", () => {
  const tempFile = makeTempFileSync({ prefix: "open_" });

  assertThrows(() => {
    const _fh = openSync(tempFile, {
      write: true,
      append: true,
      truncate: true,
    });
  }, TypeError);

  removeSync(tempFile);
});

Deno.test("openSync() throws with NotFound when opening to read a non-existent file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "openSync_" });
  const notAFile = join(tempDirPath, "non_existent.txt");

  assertThrows(() => {
    const _fh = openSync(notAFile);
  }, NotFound);

  removeSync(tempDirPath, { recursive: true });
});

Deno.test("openSync() throws with Error when opening a non-existent directory", () => {
  const tempDirPath = makeTempDirSync({ prefix: "openSync_" });
  const testDir = join(tempDirPath, "testDir");

  assertThrows(() => {
    const _fh = openSync(testDir);
  }, Error);

  removeSync(tempDirPath, { recursive: true });
});
