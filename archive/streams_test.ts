/**
 * Tar test
 *
 * **test summary**
 * - create a tar archive in memory containing output.txt and dir/tar.ts.
 * - read and deflate a tar archive containing output.txt
 *
 * **to run this test**
 * deno test --allow-read archive/streams_test.ts
 */
import { assert, assertEquals } from "../testing/asserts.ts";

import { TarDecoderStream, TarEncoderStream } from "./streams.ts";
import { dirname, fromFileUrl, resolve } from "../path/mod.ts";
import { Buffer } from "../io/buffer.ts";
import {
  readableStreamFromReader,
  readAll,
  readerFromStreamReader,
  writableStreamFromWriter,
} from "../streams/conversion.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");
const filePath = resolve("archive", "testdata", "example.txt");

interface TestEntry {
  fileName: string;
  content?: Uint8Array;
  filePath?: string;
}

function createTar(entries: TestEntry[]) {
  const tar = TarEncoderStream.create();
  const writer = tar.writable.getWriter();
  // put data on memory
  for (const file of entries) {
    let options;

    if (file.content) {
      options = {
        fileName: file.fileName,
        reader: new Buffer(file.content),
        contentSize: file.content.byteLength,
      };
    } else {
      options = file;
    }

    writer.write(options);
  }
  writer.close();
  return tar;
}

Deno.test("createTarArchive", async function createTarArchive() {
  const encoder = TarEncoderStream.create();
  const { writable, readable } = encoder;
  const writer = writable.getWriter();
  const content = new TextEncoder().encode("hello tar world!");
  writer.write({
    fileName: "output.txt",
    reader: new Buffer(content),
    contentSize: content.byteLength,
  });
  writer.write({
    fileName: "dir/tar.ts",
    filePath,
  });
  writer.close();

  const reader = readerFromStreamReader(readable.getReader());
  const data = await readAll(reader);
  // /**
  //  * 3072 = 512 (header) + 512 (content) + 512 (header) + 512 (content)
  //  *       + 1024 (footer)
  //  */
  assertEquals(data.byteLength, 3072);
});

Deno.test("deflateTarArchive", async function () {
  const fileName = "output.txt";
  const text = "hello tar world!";

  // create a tar archive
  const tar = TarEncoderStream.create();
  const tarWriter = tar.writable.getWriter();
  const content = new TextEncoder().encode(text);
  tarWriter.write({
    fileName,
    reader: new Buffer(content),
    contentSize: content.byteLength,
  });
  tarWriter.close();
  // read data from a tar archive
  const untar = TarDecoderStream.create();
  const untarReader = tar.readable.pipeThrough(untar).getReader();
  const { value: entry } = await untarReader.read();
  assert(entry !== null);

  const untarText = new TextDecoder("utf-8").decode(await readAll(entry!));

  assertEquals(untarText, text);
  assertEquals(entry!.fileName, fileName);
  const { done } = await untarReader.read();
  assert(done); // EOF
});

Deno.test("appendFileWithLongNameToTarArchive", async function (): Promise<
  void
> {
  // 9 * 15 + 13 = 148 bytes
  const fileName = "long-file-name/".repeat(10) + "file-name.txt";
  const text = "hello tar world!";

  // create a tar archive
  const tar = TarEncoderStream.create();
  const tarWriter = tar.writable.getWriter();
  const content = new TextEncoder().encode(text);
  tarWriter.write({
    fileName,
    reader: new Buffer(content),
    contentSize: content.byteLength,
  });
  tarWriter.close();

  const untar = TarDecoderStream.create();
  tar.readable.pipeThrough(untar);

  // read data from a tar archive
  const { value: entry } = await untar.readable.getReader().read();
  if (entry == null) {
    assert(false);
  } else {
    assert(!entry.consumed);
    const untarText = new TextDecoder("utf-8").decode(await readAll(entry!));
    assert(entry.consumed);
    // tests
    assertEquals(entry.fileName, fileName);
    assertEquals(untarText, text);
  }
});

Deno.test(
  "untarAsyncIteratorWithoutReadingBodyFromFileReader",
  async function () {
    const entries: TestEntry[] = [
      {
        fileName: "output.txt",
        content: new TextEncoder().encode("hello tar world!"),
      },
      {
        fileName: "dir/tar.ts",
        filePath,
      },
    ];

    const outputFile = resolve(testdataDir, "test.tar");

    const tar = createTar(entries);
    const output = await Deno.open(outputFile, { create: true, write: true });
    const outputStream = writableStreamFromWriter(output);
    await tar.readable.pipeTo(outputStream);

    const input = await Deno.open(outputFile, { read: true });
    const inputStream = readableStreamFromReader(input);
    const untar = TarDecoderStream.create();
    // read data from a tar archive
    inputStream.pipeThrough(untar);

    for await (const entry of untar.readable) {
      const expected = entries.shift();
      assert(expected);
      assertEquals(expected.fileName, entry.fileName);
    }
    assertEquals(entries.length, 0);

    // clean up
    await Deno.remove(outputFile);
  },
);

Deno.test("untarLinuxGeneratedTar", async function () {
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

  const filePath = resolve(testdataDir, "deno.tar");
  const rs = readableStreamFromReader(
    await Deno.open(filePath, { read: true }),
  );
  const untar = TarDecoderStream.create();
  rs.pipeThrough(untar);

  for await (const entry of untar.readable) {
    const expected = expectedEntries.shift();
    assert(expected);
    const content = expected.content;
    delete expected.content;

    assertEquals({ ...entry }, expected);

    if (content) {
      assertEquals(content, await readAll(entry));
    }
  }
});
