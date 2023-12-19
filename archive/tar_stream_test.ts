// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Tar test
 *
 * **test summary**
 * - create a tar archive in memory containing output.txt and dir/tar.ts.
 * - read and deflate a tar archive containing output.txt
 *
 * **to run this test**
 * deno run --allow-read archive/tar_test.ts
 */
import { assert, assertEquals } from "../assert/mod.ts";

import { dirname, fromFileUrl, resolve } from "../path/mod.ts";
import { type TarOptions, TarStream } from "./tar_stream.ts";
import { UntarStream } from "./untar_stream.ts";
import { Buffer } from "../streams/buffer.ts";
import { toText } from "../streams/to_text.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");

Deno.test("createTarArchive", async function () {
  // initialize
  const { readable, writable } = new TarStream();

  // write tar data to a buffer
  const buf = new Buffer();

  const promise = readable.pipeTo(buf.writable);

  const writer = writable.getWriter();
  // put data on memory
  const content = new TextEncoder().encode("hello tar world!");
  await writer.write({
    name: "output.txt",
    readable: ReadableStream.from([content]),
    contentSize: content.byteLength,
  });
  await writer.close();

  await promise;

  // 2048 = 512 (header) + 512 (content) + 1024 (footer)
  assertEquals(buf.bytes().length, 2048);

  await Deno.writeFile("test.tar", buf.readable);
});

Deno.test("appendFileWithLongNameToTarArchive", async function () {
  // 9 * 15 + 13 = 148 bytes
  const fileName = "long-file-name/".repeat(10) + "file-name.txt";
  const text = "hello tar world!";

  // create a tar archive
  const untar = new UntarStream();
  await ReadableStream.from([
    {
      name: fileName,
      readable: ReadableStream.from([
        new TextEncoder().encode(text),
      ]),
      contentSize: 16,
    },
  ]).pipeThrough(new TarStream())
    .pipeTo(untar.writable);

  // read data from a tar archive
  const untarReader = untar.readable.getReader();
  const result = await untarReader.read();
  assert(!result.done);
  assert(!result.value.consumed);

  const untarText = await toText(result.value.readable);
  assert(result.value.consumed);

  // tests
  assertEquals(result.value.fileName, fileName);
  assertEquals(untarText, text);
});

Deno.test("directoryEntryType", async function () {
  const outputFile = resolve(testdataDir, "directory_type_test.tar");
  const file = await Deno.open(outputFile, { create: true, write: true });

  await ReadableStream.from<TarOptions>([
    {
      name: "directory/",
      readable: ReadableStream.from([]),
      contentSize: 0,
      type: "directory",
    },
    {
      name: "archive/testdata/",
      type: "directory",
      readable: ReadableStream.from([]),
      contentSize: 0,
    },
  ]).pipeThrough(new TarStream())
    .pipeTo(file.writable);

  const readFile = await Deno.open(outputFile, { read: true });
  const untar = new UntarStream();
  await readFile.readable.pipeTo(untar.writable);
  for await (const entry of untar.readable) {
    assertEquals(entry.type, "directory");
  }

  await Deno.remove(outputFile);
});
