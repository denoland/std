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
import { UntarStream } from "./untar_stream.ts";
import { Buffer } from "../streams/buffer.ts";
import { type TarOptions, TarStream } from "./tar_stream.ts";
import { toArrayBuffer } from "../streams/to_array_buffer.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");
const filePath = resolve(testdataDir, "example.txt");

interface TestEntry {
  name: string;
  content?: Uint8Array;
  filePath?: string;
}

Deno.test("deflateTarArchive", async function () {
  const fileName = "output.txt";
  const text = "hello tar world!";

  // create a tar archive
  const tar = new TarStream();
  const buf = new Buffer();
  const promise = tar.readable.pipeTo(buf.writable, { preventClose: true });
  const writer = tar.writable.getWriter();
  const content = new TextEncoder().encode(text);
  await writer.write({
    name: fileName,
    readable: ReadableStream.from([content]),
    contentSize: content.byteLength,
  });
  await writer.close();
  await promise;

  const untar = new UntarStream();
  await buf.readable.pipeTo(untar.writable);
  const reader = untar.readable.getReader();
  const result = await reader.read();
  assert(!result.done);

  let untarText = "";
  for await (
    const s of result.value.readable.pipeThrough(new TextDecoderStream())
  ) {
    untarText += s;
  }

  assert((await reader.read()).done); // EOF
  // tests
  assertEquals(result.value.fileName, fileName);
  assertEquals(untarText, text);
});

Deno.test("untarAsyncIterator", async function () {
  const file = await Deno.open(filePath, { read: true });
  const entries: TarOptions[] = [
    {
      name: "output.txt",
      readable: ReadableStream.from([
        new TextEncoder().encode("hello tar world!"),
      ]),
      contentSize: 16,
    },
    {
      name: "dir/tar.ts",
      readable: file.readable,
      contentSize: file.statSync().size,
    },
  ];

  const untar = new UntarStream();
  await ReadableStream.from<TarOptions>(entries)
    .pipeThrough(new TarStream())
    .pipeTo(untar.writable);

  let lastEntry;
  for await (const entry of untar.readable) {
    const expected = entries.shift();
    assert(expected);

    const buffer = new Buffer();
    await entry.readable.pipeTo(buffer.writable);
    assertEquals(
      await toArrayBuffer(expected.readable),
      await toArrayBuffer(buffer.readable),
    );
    assertEquals(expected.name, entry.fileName);

    if (lastEntry) assert(lastEntry.consumed);
    lastEntry = entry;
  }
  assert(lastEntry);
  assert(lastEntry.consumed);
  assertEquals(entries.length, 0);
});

Deno.test("untarLinuxGeneratedTar", async function () {
  const filePath = resolve(testdataDir, "deno.tar");
  const file = await Deno.open(filePath, { read: true });

  const expectedEntries = [
    {
      fileName: "archive/",
      fileSize: 0,
      fileMode: 509,
      mtime: 1591800767,
      uid: 1001,
      gid: 1001,
      owner: "deno",
      group: "deno",
      type: "directory",
    },
    {
      fileName: "archive/deno/",
      fileSize: 0,
      fileMode: 509,
      mtime: 1591799635,
      uid: 1001,
      gid: 1001,
      owner: "deno",
      group: "deno",
      type: "directory",
    },
    {
      fileName: "archive/deno/land/",
      fileSize: 0,
      fileMode: 509,
      mtime: 1591799660,
      uid: 1001,
      gid: 1001,
      owner: "deno",
      group: "deno",
      type: "directory",
    },
    {
      fileName: "archive/deno/land/land.txt",
      fileMode: 436,
      fileSize: 5,
      mtime: 1591799660,
      uid: 1001,
      gid: 1001,
      owner: "deno",
      group: "deno",
      type: "file",
      content: new TextEncoder().encode("land\n"),
    },
    {
      fileName: "archive/file.txt",
      fileMode: 436,
      fileSize: 5,
      mtime: 1591799626,
      uid: 1001,
      gid: 1001,
      owner: "deno",
      group: "deno",
      type: "file",
      content: new TextEncoder().encode("file\n"),
    },
    {
      fileName: "archive/deno.txt",
      fileMode: 436,
      fileSize: 5,
      mtime: 1591799642,
      uid: 1001,
      gid: 1001,
      owner: "deno",
      group: "deno",
      type: "file",
      content: new TextEncoder().encode("deno\n"),
    },
  ];

  const untar = new UntarStream();
  await file.readable.pipeTo(untar.writable);

  for await (const entry of untar.readable) {
    const expected = expectedEntries.shift();
    assert(expected);
    const content = expected.content;
    delete expected.content;

    // @ts-ignore its fine
    assertEquals({ ...entry }, expected);

    if (content) {
      const buffer = new Buffer();
      entry.readable.pipeTo(buffer.writable);
      assertEquals(content, buffer.bytes());
    }
  }
});
