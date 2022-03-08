// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
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
import { assert, assertEquals } from "../testing/asserts.ts";

import { dirname, fromFileUrl, resolve } from "../path/mod.ts";
import { TarStream, UntarStream } from "./tar_stream.ts";
import { Buffer } from "../io/buffer.ts";
import {
  readableStreamFromReader,
  writableStreamFromWriter,
} from "../streams/conversion.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");
const filePath = resolve(testdataDir, "example.txt");

interface TestEntry {
  name: string;
  content?: Uint8Array;
  filePath?: string;
}

async function createTar(
  entries: TestEntry[],
): Promise<ReadableStream<Uint8Array>> {
  const { readable, writable } = new TarStream();

  const writer = writable.getWriter();
  // put data on memory
  for (const file of entries) {
    let options;

    if (file.content) {
      options = {
        name: file.name,
        readable: new ReadableStream({
          start(c) {
            c.enqueue(file.content);
            c.close();
          },
        }),
        contentSize: file.content.byteLength,
      };
    } else {
      options = { name: file.name, filePath: file.filePath };
    }

    await writer.write(options);
  }

  return readable;
}

Deno.test("createTarArchive", async function () {
  // initialize
  const { readable, writable } = new TarStream();

  // write tar data to a buffer
  const buf = new Buffer();

  const promise = readable.pipeTo(writableStreamFromWriter(buf));

  const writer = writable.getWriter();
  // put data on memory
  const content = new TextEncoder().encode("hello tar world!");
  await writer.write({
    name: "output.txt",
    readable: new ReadableStream({
      start(c) {
        c.enqueue(content);
        c.close();
      },
    }),
    contentSize: content.byteLength,
  });

  // put a file
  await writer.write({ name: "dir/tar.ts", filePath });
  await writer.close();

  await promise;

  /**
   * 3072 = 512 (header) + 512 (content) + 512 (header) + 512 (content)
   *       + 1024 (footer)
   */
  assertEquals(buf.bytes().length, 3072);
});

Deno.test("deflateTarArchive", async function () {
  const fileName = "output.txt";
  const text = "hello tar world!";

  // create a tar archive
  const tar = new TarStream();

  const promise = (async () => {
    // read data from a tar archive
    const untar = new UntarStream();
    const promise2 = tar.readable.pipeTo(untar.writable);
    const reader = untar.readable.getReader();
    const result = await reader.read();
    assert(!result.done);
    let untarText = "";
    for await (const s of result.value.pipeThrough(new TextDecoderStream())) {
      untarText += s;
    }
    await promise2;

    assert((await reader.read()).done); // EOF
    // tests
    assertEquals(result.value.fileName, fileName);
    assertEquals(untarText, text);
  })();

  const writer = tar.writable.getWriter();
  const content = new TextEncoder().encode(text);
  await writer.write({
    name: fileName,
    readable: new ReadableStream({
      start(c) {
        c.enqueue(content);
        c.close();
      },
    }),
    contentSize: content.byteLength,
  });
  await writer.close();

  await promise;
});

Deno.test("appendFileWithLongNameToTarArchive", async function (): Promise<
  void
> {
  // 9 * 15 + 13 = 148 bytes
  const fileName = "long-file-name/".repeat(10) + "file-name.txt";
  const text = "hello tar world!";

  // create a tar archive
  const tar = new TarStream();
  const writer = tar.writable.getWriter();
  const content = new TextEncoder().encode(text);
  await writer.write({
    name: fileName,
    readable: new ReadableStream({
      start(c) {
        c.enqueue(content);
        c.close();
      },
    }),
    contentSize: content.byteLength,
  });
  writer.releaseLock();

  // read data from a tar archive
  const untar = new UntarStream();
  await tar.readable.pipeTo(untar.writable);
  const untarReader = untar.readable.getReader();
  const result = await untarReader.read();
  assert(!result.done);
  assert(!result.value.consumed);
  let untarText = "";
  for await (const s of result.value.pipeThrough(new TextDecoderStream())) {
    untarText += s;
  }
  assert(result.value.consumed);

  // tests
  assertEquals(result.value.fileName, fileName);
  assertEquals(untarText, text);
});

Deno.test("untarAsyncIterator", async function () {
  const entries: TestEntry[] = [
    {
      name: "output.txt",
      content: new TextEncoder().encode("hello tar world!"),
    },
    {
      name: "dir/tar.ts",
      filePath,
    },
  ];

  const tarReadable = await createTar(entries);

  // read data from a tar archive
  const untar = new UntarStream();
  await tarReadable.pipeTo(untar.writable);

  let lastEntry;
  for await (const entry of untar.readable) {
    const expected = entries.shift();
    assert(expected);

    let content = expected.content;
    if (expected.filePath) {
      content = await Deno.readFile(expected.filePath);
    }
    const writer = new Buffer();
    entry.pipeTo(writableStreamFromWriter(writer));
    assertEquals(content, writer.bytes());
    assertEquals(expected.name, entry.fileName);

    if (lastEntry) assert(lastEntry.consumed);
    lastEntry = entry;
  }
  assert(lastEntry);
  assert(lastEntry.consumed);
  assertEquals(entries.length, 0);
});

Deno.test("untarAsyncIteratorWithoutReadingBody", async function (): Promise<
  void
> {
  const entries: TestEntry[] = [
    {
      name: "output.txt",
      content: new TextEncoder().encode("hello tar world!"),
    },
    {
      name: "dir/tar.ts",
      filePath,
    },
  ];

  const tarReadable = await createTar(entries);

  // read data from a tar archive
  const untar = new UntarStream();
  await tarReadable.pipeTo(untar.writable);

  for await (const entry of untar.readable) {
    const expected = entries.shift();
    assert(expected);
    assertEquals(expected.name, entry.fileName);
  }

  assertEquals(entries.length, 0);
});

Deno.test(
  "untarAsyncIteratorWithoutReadingBodyFromFileReader",
  async function () {
    const entries: TestEntry[] = [
      {
        name: "output.txt",
        content: new TextEncoder().encode("hello tar world!"),
      },
      {
        name: "dir/tar.ts",
        filePath,
      },
    ];

    const outputFile = resolve(testdataDir, "test.tar");

    const tarReadable = await createTar(entries);
    const file = await Deno.open(outputFile, { create: true, write: true });
    await tarReadable.pipeTo(writableStreamFromWriter(file));

    const reader = await Deno.open(outputFile, { read: true });
    // read data from a tar archive
    const untar = new UntarStream();
    await readableStreamFromReader(reader).pipeTo(untar.writable);

    for await (const entry of untar.readable) {
      const expected = entries.shift();
      assert(expected);
      assertEquals(expected.name, entry.fileName);
    }

    await Deno.remove(outputFile);
    assertEquals(entries.length, 0);
  },
);

Deno.test("untarAsyncIteratorFromFileReader", async function () {
  const entries: TestEntry[] = [
    {
      name: "output.txt",
      content: new TextEncoder().encode("hello tar world!"),
    },
    {
      name: "dir/tar.ts",
      filePath,
    },
  ];

  const outputFile = resolve(testdataDir, "test.tar");

  const tarReadable = await createTar(entries);
  const file = await Deno.open(outputFile, { create: true, write: true });
  await tarReadable.pipeTo(writableStreamFromWriter(file));

  const reader = await Deno.open(outputFile, { read: true });
  // read data from a tar archive
  const untar = new UntarStream();
  await readableStreamFromReader(reader).pipeTo(untar.writable);

  for await (const entry of untar.readable) {
    const expected = entries.shift();
    assert(expected);

    let content = expected.content;
    if (expected.filePath) {
      content = await Deno.readFile(expected.filePath);
    }

    const writer = new Buffer();
    entry.pipeTo(writableStreamFromWriter(writer));
    assertEquals(content, writer.bytes());
    assertEquals(expected.name, entry.fileName);
  }

  await Deno.remove(outputFile);
  assertEquals(entries.length, 0);
});

Deno.test(
  "untarAsyncIteratorReadingLessThanRecordSize",
  async function () {
    // record size is 512
    const bufSizes = [1, 53, 256, 511];

    for (const bufSize of bufSizes) {
      const entries: TestEntry[] = [
        {
          name: "output.txt",
          content: new TextEncoder().encode("hello tar world!".repeat(100)),
        },
        // Need to test at least two files, to make sure the first entry doesn't over-read
        // Causing the next to fail with: checksum error
        {
          name: "deni.txt",
          content: new TextEncoder().encode("deno!".repeat(250)),
        },
      ];

      const tarReadable = await createTar(entries);

      // read data from a tar archive
      const untar = new UntarStream();
      await tarReadable.pipeTo(untar.writable);

      for await (const entry of untar.readable) {
        const expected = entries.shift();
        assert(expected);
        assertEquals(expected.name, entry.fileName);

        const writer = new Buffer();
        entry.pipeTo(writableStreamFromWriter(writer));
        assertEquals(writer.bytes(), expected!.content);
      }

      assertEquals(entries.length, 0);
    }
  },
);

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
  await readableStreamFromReader(file).pipeTo(untar.writable);

  for await (const entry of untar.readable) {
    const expected = expectedEntries.shift();
    assert(expected);
    const content = expected.content;
    delete expected.content;

    assertEquals({ ...entry }, expected);

    if (content) {
      const writer = new Buffer();
      entry.pipeTo(writableStreamFromWriter(writer));
      assertEquals(content, writer.bytes());
    }
  }
});

Deno.test("directoryEntryType", async function () {
  const tar = new TarStream();
  const tarWriter = tar.writable.getWriter();

  await tarWriter.write({
    name: "directory/",
    readable: new ReadableStream({
      start(c) {
        c.close();
      },
    }),
    contentSize: 0,
    type: "directory",
  });

  const filePath = resolve(testdataDir);
  await tarWriter.write({
    name: "archive/testdata/",
    filePath,
  });

  const outputFile = resolve(testdataDir, "directory_type_test.tar");
  const file = await Deno.open(outputFile, { create: true, write: true });
  await tar.readable.pipeTo(writableStreamFromWriter(file));

  const reader = await Deno.open(outputFile, { read: true });
  const untar = new UntarStream();
  await readableStreamFromReader(reader).pipeTo(untar.writable);
  for await (const entry of untar.readable) {
    assertEquals(entry.type, "directory");
  }

  await Deno.remove(outputFile);
});
