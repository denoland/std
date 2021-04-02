// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals } from "../testing/asserts.ts";
import {
  readableStreamFromIterable,
  readerFromIterable,
  readerFromStreamReader,
  writableStreamFromWriter,
  writerFromStreamWriter,
} from "./streams.ts";
import { Buffer } from "./buffer.ts";

function repeat(c: string, bytes: number): Uint8Array {
  assertEquals(c.length, 1);
  const ui8 = new Uint8Array(bytes);
  ui8.fill(c.charCodeAt(0));
  return ui8;
}

Deno.test("[io] readerFromIterable()", async function () {
  const reader = readerFromIterable((function* () {
    const encoder = new TextEncoder();
    for (const string of ["hello", "deno", "foo"]) {
      yield encoder.encode(string);
    }
  })());

  const readStrings = [];
  const decoder = new TextDecoder();
  const p = new Uint8Array(4);
  while (true) {
    const n = await reader.read(p);
    if (n == null) {
      break;
    }
    readStrings.push(decoder.decode(p.slice(0, n)));
  }
  assertEquals(readStrings, ["hell", "o", "deno", "foo"]);
});

Deno.test("[io] writerFromStreamWriter()", async function () {
  const written: string[] = [];
  const chunks: string[] = ["hello", "deno", "land"];
  const writableStream = new WritableStream({
    write(chunk): void {
      const decoder = new TextDecoder();
      written.push(decoder.decode(chunk));
    },
  });

  const encoder = new TextEncoder();
  const writer = writerFromStreamWriter(writableStream.getWriter());

  for (const chunk of chunks) {
    const n = await writer.write(encoder.encode(chunk));
    // stream writers always write all the bytes
    assertEquals(n, chunk.length);
  }

  assertEquals(written, chunks);
});

Deno.test("[io] readerFromStreamReader()", async function () {
  const chunks: string[] = ["hello", "deno", "land"];
  const expected = chunks.slice();
  const readChunks: Uint8Array[] = [];
  const readableStream = new ReadableStream({
    pull(controller): void {
      const encoder = new TextEncoder();
      const chunk = chunks.shift();
      if (!chunk) return controller.close();
      controller.enqueue(encoder.encode(chunk));
    },
  });

  const decoder = new TextDecoder();
  const reader = readerFromStreamReader(readableStream.getReader());

  let i = 0;

  while (true) {
    const b = new Uint8Array(1024);
    const n = await reader.read(b);

    if (n === null) break;

    readChunks.push(b.subarray(0, n));
    assert(i < expected.length);

    i++;
  }

  assertEquals(
    expected,
    readChunks.map((chunk) => decoder.decode(chunk)),
  );
});

Deno.test("[io] readerFromStreamReader() big chunks", async function () {
  const bufSize = 1024;
  const chunkSize = 3 * bufSize;
  const writer = new Buffer();

  // A readable stream can enqueue chunks bigger than Copy bufSize
  // Reader returned by toReader should enqueue exceeding bytes
  const chunks: string[] = [
    "a".repeat(chunkSize),
    "b".repeat(chunkSize),
    "c".repeat(chunkSize),
  ];
  const expected = chunks.slice();
  const readableStream = new ReadableStream({
    pull(controller): void {
      const encoder = new TextEncoder();
      const chunk = chunks.shift();
      if (!chunk) return controller.close();

      controller.enqueue(encoder.encode(chunk));
    },
  });

  const reader = readerFromStreamReader(readableStream.getReader());
  const n = await Deno.copy(reader, writer, { bufSize });

  const expectedWritten = chunkSize * expected.length;
  assertEquals(n, chunkSize * expected.length);
  assertEquals(writer.length, expectedWritten);
});

Deno.test("[io] readerFromStreamReader() irregular chunks", async function () {
  const bufSize = 1024;
  const chunkSize = 3 * bufSize;
  const writer = new Buffer();

  // A readable stream can enqueue chunks bigger than Copy bufSize
  // Reader returned by toReader should enqueue exceeding bytes
  const chunks: Uint8Array[] = [
    repeat("a", chunkSize),
    repeat("b", chunkSize + 253),
    repeat("c", chunkSize + 8),
  ];
  const expected = new Uint8Array(
    chunks
      .slice()
      .map((chunk) => [...chunk])
      .flat(),
  );
  const readableStream = new ReadableStream({
    pull(controller): void {
      const chunk = chunks.shift();
      if (!chunk) return controller.close();

      controller.enqueue(chunk);
    },
  });

  const reader = readerFromStreamReader(readableStream.getReader());

  const n = await Deno.copy(reader, writer, { bufSize });
  assertEquals(n, expected.length);
  assertEquals(expected, writer.bytes());
});

Deno.test("[io] writableStreamFromWriter()", async function () {
  const written: string[] = [];
  const chunks: string[] = ["hello", "deno", "land"];
  const decoder = new TextDecoder();

  // deno-lint-ignore require-await
  async function write(p: Uint8Array): Promise<number> {
    written.push(decoder.decode(p));
    return p.length;
  }

  const writableStream = writableStreamFromWriter({ write });

  const encoder = new TextEncoder();
  const streamWriter = writableStream.getWriter();
  for (const chunk of chunks) {
    await streamWriter.write(encoder.encode(chunk));
  }

  assertEquals(written, chunks);
});

Deno.test("[io] readableStreamFromIterable() array", async function () {
  const strings: string[] = ["hello", "deno", "land"];
  const encoder = new TextEncoder();
  const readableStream = readableStreamFromIterable(
    strings.map((s) => encoder.encode(s)),
  );

  const readStrings = [];
  const decoder = new TextDecoder();
  for await (const chunk of readableStream) {
    readStrings.push(decoder.decode(chunk));
  }

  assertEquals(readStrings, strings);
});

Deno.test("[io] readableStreamFromIterable() generator", async function () {
  const strings: string[] = ["hello", "deno", "land"];
  const readableStream = readableStreamFromIterable((function* () {
    const encoder = new TextEncoder();
    for (const string of strings) {
      yield encoder.encode(string);
    }
  })());

  const readStrings = [];
  const decoder = new TextDecoder();
  for await (const chunk of readableStream) {
    readStrings.push(decoder.decode(chunk));
  }

  assertEquals(readStrings, strings);
});
