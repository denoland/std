// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals, assertRejects, assertThrows } from "@std/assert";
import { open, openSync } from "./unstable_open.ts";
import { makeTempDir, makeTempDirSync } from "./unstable_make_temp_dir.ts";
import { makeTempFile, makeTempFileSync } from "./unstable_make_temp_file.ts";
import { remove, removeSync } from "./unstable_remove.ts";
import { readFile, readFileSync } from "./unstable_read_file.ts";
import { readTextFile } from "./unstable_read_text_file.ts";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");
const readTestFile = join(testdataDir, "copy_file.txt");
const isBun = navigator.userAgent.includes("Bun/");

Deno.test("FsFile object writes to a newly created file", async () => {
  const tempDirPath = await makeTempDir({ prefix: "FsFile_write_" });
  const testFile = join(tempDirPath, "testFile.txt");
  const fh = await open(testFile, { create: true, write: true });

  const encoder = new TextEncoder();
  const writeData = encoder.encode("Hello World");
  const writeBytes = await fh.write(writeData);
  assertEquals(writeBytes, 11);

  fh.close();
  await remove(tempDirPath, { recursive: true });
});

Deno.test("FsFile object reads from an existing file", async () => {
  const fh = await open(readTestFile);

  const buf = new Uint8Array(3);
  const readBytes = await fh.read(buf);
  assertEquals(readBytes, 3);

  const decoder = new TextDecoder();
  const txtStr = decoder.decode(buf);
  assertEquals(txtStr, "txt");

  fh.close();
});

Deno.test("FsFile object rejects with Error when reading from a directory", async () => {
  const fh = await open(".");

  let readBytes;
  const buf = new Uint8Array(100);
  await assertRejects(async () => {
    readBytes = await fh.read(buf);
  }, Error);
  assertEquals(readBytes, undefined);

  fh.close();
});

Deno.test("FsFile object truncates a file to zero", async () => {
  const tempDirPath = await makeTempDir({ prefix: "FsFile_truncate_" });
  const testFile = join(tempDirPath, "testFile.txt");
  let fh = await open(testFile, { read: true, create: true, write: true });

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello, Standard Library");
  const writeBytes = await fh.write(data);
  assertEquals(writeBytes, 23);
  fh.close();

  fh = await open(testFile, { read: true, write: true });
  await fh.truncate();

  const buf = new Uint8Array(10);
  const readBytes = await fh.read(buf);
  // Reading a 0 byte file should return null at EOF.
  assertEquals(readBytes, null);

  fh.close();
  await remove(tempDirPath, { recursive: true });
});

Deno.test("FsFile object truncates the file to multiple sizes", async () => {
  const tempDirPath = await makeTempDir({ prefix: "FsFile_truncate_" });
  const testFile = join(tempDirPath, "testFile.txt");
  let fh = await open(testFile, { read: true, create: true, write: true });

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello, Standard Library");
  const writeBytes = await fh.write(data);
  assertEquals(writeBytes, 23);
  fh.close();

  const decoder = new TextDecoder("utf-8");

  fh = await open(testFile, { read: true, write: true });
  await fh.truncate(25);
  let buf = new Uint8Array(25);
  let readBytes = await fh.read(buf);
  assertEquals(readBytes, 25);
  assertEquals(decoder.decode(buf), "Hello, Standard Library\x00\x00");
  fh.close();

  fh = await open(testFile, { read: true, write: true });
  await fh.truncate(10);
  buf = new Uint8Array(10);
  readBytes = await fh.read(buf);
  assertEquals(readBytes, 10);
  assertEquals(decoder.decode(buf), "Hello, Sta");
  fh.close();

  fh = await open(testFile, { read: true, write: true });
  await fh.truncate(-5);
  buf = new Uint8Array(10);
  readBytes = await fh.read(buf);
  assertEquals(readBytes, null);
  fh.close();

  await remove(tempDirPath, { recursive: true });
});

Deno.test("FsFile object returns the 'stat' of the file handle", async () => {
  const fh = await open(readTestFile);

  const fhStat = await fh.stat();
  assert(fhStat.isFile);

  fh.close();
});

Deno.test(
  "FsFile object handles a ReadableStream",
  { ignore: isBun },
  async () => {
    const fh = await open(readTestFile);
    assert(fh.readable instanceof ReadableStream);
    const chunks = [];
    for await (const chunk of fh.readable) {
      chunks.push(chunk);
    }
    assertEquals(chunks.length, 1);
    if (chunks[0] != null) {
      assertEquals(chunks[0].byteLength, 3);
    }
  },
);

Deno.test(
  "FsFile object handles a WritableStream",
  { ignore: isBun },
  async () => {
    const tempDirPath = await makeTempDir({ prefix: "FsFile_WritableStream_" });
    const testFile = join(tempDirPath, "testFile.txt");
    const fh = await open(testFile, { create: true, write: true });
    assert(fh.writable instanceof WritableStream);
    const rs = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode("Hello,"));
        controller.enqueue(encoder.encode(" Standard"));
        controller.enqueue(encoder.encode(" Library"));
        controller.close();
      },
    });
    await rs.pipeTo(fh.writable);
    const readText = await readTextFile(testFile);
    assertEquals(readText, "Hello, Standard Library");

    await remove(tempDirPath, { recursive: true });
  },
);

Deno.test("FsFile object changes access and modification times with utime", async () => {
  const tempFile = await makeTempFile({ prefix: "FsFile_utime_" });
  const timeNow = new Date();
  const fh = await open(tempFile, { write: true });

  const statBefore = await fh.stat();
  await fh.utime(timeNow, timeNow);
  const statAfter = await fh.stat();

  fh.close();

  assert(statBefore.atime !== statAfter.atime);
  assert(statBefore.mtime !== statAfter.mtime);

  await remove(tempFile);
});

Deno.test("FsFile object flushes data to disk with 'dataSync'", async () => {
  const tempDirPath = await makeTempDir({ prefix: "FsFile_syncData_" });
  const testFile = join(tempDirPath, "testFile.txt");
  const fh = await open(testFile, { write: true, create: true });

  const data = new Uint8Array(10);
  await fh.write(data);
  await fh.syncData();
  assertEquals(await readFile(testFile), data);

  fh.close();
  await remove(tempDirPath, { recursive: true });
});

Deno.test("FsFile object flushes data and file attributes to disk with 'sync'", async () => {
  const tempDirPath = await makeTempDir({ prefix: "FsFile_sync_" });
  const testFile = join(tempDirPath, "testFile.txt");
  const fh = await open(testFile, { read: true, create: true, write: true });

  await fh.truncate(20);
  fh.sync();
  assertEquals((await fh.stat()).size, 20);

  fh.close();
  await remove(tempDirPath, { recursive: true });
});

Deno.test("FsFile object synchronously writes to a newly created file", () => {
  const tempDirPath = makeTempDirSync({ prefix: "FsFile_writeSync_" });
  const testFile = join(tempDirPath, "testFile.txt");
  const fh = openSync(testFile, { create: true, write: true });

  const encoder = new TextEncoder();
  const writeData = encoder.encode("Hello World");
  const writeBytes = fh.writeSync(writeData);
  assertEquals(writeBytes, 11);

  fh.close();
  removeSync(tempDirPath, { recursive: true });
});

Deno.test("FsFile object synchronously reads from an existing file", () => {
  const fh = openSync(readTestFile);

  const buf = new Uint8Array(3);
  const readBytes = fh.readSync(buf);
  assertEquals(readBytes, 3);

  const decoder = new TextDecoder();
  const txtStr = decoder.decode(buf);
  assertEquals(txtStr, "txt");

  fh.close();
});

Deno.test(
  "FsFile object synchronously truncates a file to zero",
  { ignore: isBun },
  () => {
    const tempDirPath = makeTempDirSync({ prefix: "FsFile_truncateSync_" });
    const testFile = join(tempDirPath, "testFile.txt");
    let fh = openSync(testFile, { read: true, write: true, create: true });

    const encoder = new TextEncoder();
    const data = encoder.encode("Hello, Standard Library");
    const writeBytes = fh.writeSync(data);
    assertEquals(writeBytes, 23);
    fh.close();

    fh = openSync(testFile, { read: true, write: true });
    fh.truncateSync();

    const buf = new Uint8Array(10);
    const readBytes = fh.readSync(buf);
    // Reading a 0 byte file should return null at EOF.
    assertEquals(readBytes, null);
    fh.close();

    removeSync(tempDirPath, { recursive: true });
  },
);

Deno.test("FsFile object synchronously truncates files to multiple sizes", () => {
  const tempDirPath = makeTempDirSync({ prefix: "FsFile_truncateSync_" });
  const testFile = join(tempDirPath, "testFile.txt");
  let fh = openSync(testFile, { read: true, write: true, create: true });

  const encoder = new TextEncoder();
  const data = encoder.encode("Hello, Standard Library");
  const writeBytes = fh.writeSync(data);
  assertEquals(writeBytes, 23);
  fh.close();

  const decoder = new TextDecoder("utf-8");

  fh = openSync(testFile, { read: true, write: true });
  fh.truncateSync(25);
  let buf = new Uint8Array(25);
  let readBytes = fh.readSync(buf);
  assertEquals(readBytes, 25);
  assertEquals(decoder.decode(buf), "Hello, Standard Library\x00\x00");
  fh.close();

  fh = openSync(testFile, { read: true, write: true });
  fh.truncateSync(10);
  buf = new Uint8Array(10);
  readBytes = fh.readSync(buf);
  assertEquals(readBytes, 10);
  assertEquals(decoder.decode(buf), "Hello, Sta");
  fh.close();

  fh = openSync(testFile, { read: true, write: true });
  fh.truncateSync(-5);
  buf = new Uint8Array(10);
  readBytes = fh.readSync(buf);
  assertEquals(readBytes, null);
  fh.close();

  removeSync(tempDirPath, { recursive: true });
});

Deno.test("FsFile object synchronously returns the 'stat' of the file handle", () => {
  const fh = openSync(readTestFile);

  const fhStat = fh.statSync();
  assert(fhStat.isFile);

  fh.close();
});

Deno.test("FsFile object synchronously changes the access and modification times of a file", () => {
  const tempFile = makeTempFileSync({ prefix: "FsFile_utimeSync_" });
  const timeNow = new Date();
  const fh = openSync(tempFile, { write: true });

  const statBefore = fh.statSync();
  fh.utimeSync(timeNow, timeNow);
  const statAfter = fh.statSync();
  fh.close();

  assert(statBefore.atime !== statAfter.atime);
  assert(statBefore.mtime !== statAfter.mtime);

  removeSync(tempFile);
});

Deno.test("FsFile object synchronously flushes data to disk with 'syncDataSync'", () => {
  const tempDirPath = makeTempDirSync({ prefix: "FsFile_syncDataSync_" });
  const testFile = join(tempDirPath, "testFile.txt");
  const fh = openSync(testFile, { create: true, write: true });

  const data = new Uint8Array(10);
  fh.writeSync(data);
  fh.syncDataSync();
  assertEquals(readFileSync(testFile), data);

  fh.close();
  removeSync(tempDirPath, { recursive: true });
});

Deno.test("FsFile object synchronously flushes data and file attributes to disk with 'syncSync'", () => {
  const tempDirPath = makeTempDirSync({ prefix: "FsFile_syncSync_" });
  const testFile = join(tempDirPath, "testFile.txt");
  const fh = openSync(testFile, { read: true, create: true, write: true });

  fh.truncateSync(20);
  fh.syncSync();
  assertEquals(fh.statSync().size, 20);

  fh.close();
  removeSync(tempDirPath, { recursive: true });
});

Deno.test("FsFile object throws with Error when synchronously reading from a directory", () => {
  const fh = openSync(".");

  let readBytes;
  const buf = new Uint8Array(100);
  assertThrows(() => {
    readBytes = fh.readSync(buf);
  }, Error);
  assertEquals(readBytes, undefined);

  fh.close();
});

Deno.test("FsFile object can determine if the file handle is a TTY (Terminal)", async () => {
  {
    const fh = await open(readTestFile);
    assert(!fh.isTerminal());
    fh.close();
  }

  {
    const fh = openSync(readTestFile);
    assert(!fh.isTerminal());
    fh.close();
  }
});
