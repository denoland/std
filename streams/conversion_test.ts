// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals, assertRejects } from "../testing/asserts.ts";
import {
  copy,
  iterateReader,
  iterateReaderSync,
  readableStreamFromIterable,
  readableStreamFromReader,
  readAll,
  readAllSync,
  readerFromIterable,
  readerFromStreamReader,
  toTransformStream,
  writableStreamFromWriter,
  writeAll,
  writeAllSync,
  writerFromStreamWriter,
} from "./conversion.ts";
import { Buffer } from "../io/buffer.ts";
import { concat, copy as copyBytes } from "../bytes/mod.ts";

function repeat(c: string, bytes: number): Uint8Array {
  assertEquals(c.length, 1);
  const ui8 = new Uint8Array(bytes);
  ui8.fill(c.charCodeAt(0));
  return ui8;
}

Deno.test("[streams] readerFromIterable()", async function () {
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

Deno.test("[streams] writerFromStreamWriter()", async function () {
  const written: string[] = [];
  const chunks: string[] = ["hello", "deno", "land"];
  const writableStream = new WritableStream({
    write(chunk) {
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

Deno.test("[streams] readerFromStreamReader()", async function () {
  const chunks: string[] = ["hello", "deno", "land"];
  const expected = chunks.slice();
  const readChunks: Uint8Array[] = [];
  const readableStream = new ReadableStream({
    pull(controller) {
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

Deno.test("[streams] readerFromStreamReader() big chunks", async function () {
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
    pull(controller) {
      const encoder = new TextEncoder();
      const chunk = chunks.shift();
      if (!chunk) return controller.close();

      controller.enqueue(encoder.encode(chunk));
    },
  });

  const reader = readerFromStreamReader(readableStream.getReader());
  const n = await copy(reader, writer, { bufSize });

  const expectedWritten = chunkSize * expected.length;
  assertEquals(n, chunkSize * expected.length);
  assertEquals(writer.length, expectedWritten);
});

Deno.test("[streams] readerFromStreamReader() irregular chunks", async function () {
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
    pull(controller) {
      const chunk = chunks.shift();
      if (!chunk) return controller.close();

      controller.enqueue(chunk);
    },
  });

  const reader = readerFromStreamReader(readableStream.getReader());

  const n = await copy(reader, writer, { bufSize });
  assertEquals(n, expected.length);
  assertEquals(expected, writer.bytes());
});

class MockWriterCloser implements Deno.Writer, Deno.Closer {
  chunks: Uint8Array[] = [];
  closeCall = 0;

  write(p: Uint8Array): Promise<number> {
    if (this.closeCall) {
      throw new Error("already closed");
    }
    if (p.length) {
      this.chunks.push(p);
    }
    return Promise.resolve(p.length);
  }

  close() {
    this.closeCall++;
  }
}

Deno.test("[streams] writableStreamFromWriter()", async function () {
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

Deno.test("[streams] writableStreamFromWriter() - calls close on close", async function () {
  const written: string[] = [];
  const chunks: string[] = ["hello", "deno", "land"];
  const decoder = new TextDecoder();

  const writer = new MockWriterCloser();
  const writableStream = writableStreamFromWriter(writer);

  const encoder = new TextEncoder();
  const streamWriter = writableStream.getWriter();
  for (const chunk of chunks) {
    await streamWriter.write(encoder.encode(chunk));
  }
  await streamWriter.close();

  for (const chunk of writer.chunks) {
    written.push(decoder.decode(chunk));
  }

  assertEquals(written, chunks);
  assertEquals(writer.closeCall, 1);
});

Deno.test("[streams] writableStreamFromWriter() - calls close on abort", async function () {
  const written: string[] = [];
  const chunks: string[] = ["hello", "deno", "land"];
  const decoder = new TextDecoder();

  const writer = new MockWriterCloser();
  const writableStream = writableStreamFromWriter(writer);

  const encoder = new TextEncoder();
  const streamWriter = writableStream.getWriter();
  for (const chunk of chunks) {
    await streamWriter.write(encoder.encode(chunk));
  }
  await streamWriter.abort();

  for (const chunk of writer.chunks) {
    written.push(decoder.decode(chunk));
  }

  assertEquals(written, chunks);
  assertEquals(writer.closeCall, 1);
});

Deno.test("[streams] writableStreamFromWriter() - doesn't call close with autoClose false", async function () {
  const written: string[] = [];
  const chunks: string[] = ["hello", "deno", "land"];
  const decoder = new TextDecoder();

  const writer = new MockWriterCloser();
  const writableStream = writableStreamFromWriter(writer, { autoClose: false });

  const encoder = new TextEncoder();
  const streamWriter = writableStream.getWriter();
  for (const chunk of chunks) {
    await streamWriter.write(encoder.encode(chunk));
  }
  await streamWriter.close();

  for (const chunk of writer.chunks) {
    written.push(decoder.decode(chunk));
  }

  assertEquals(written, chunks);
  assertEquals(writer.closeCall, 0);
});

Deno.test("[streams] readableStreamFromIterable() array", async function () {
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

Deno.test("[streams] readableStreamFromIterable() generator", async function () {
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

Deno.test("[streams] readableStreamFromIterable() cancel", async function () {
  let generatorError = null;
  const readable = readableStreamFromIterable(async function* () {
    try {
      yield "foo";
    } catch (error) {
      generatorError = error;
    }
  }());
  const reader = readable.getReader();
  assertEquals(await reader.read(), { value: "foo", done: false });
  const cancelReason = new Error("Cancelled by consumer.");
  await reader.cancel(cancelReason);
  assertEquals(generatorError, cancelReason);
});

Deno.test({
  name: "[streams] toTransformStream()",
  async fn() {
    const readable = readableStreamFromIterable([0, 1, 2])
      .pipeThrough(toTransformStream(async function* (src) {
        for await (const i of src) {
          yield i * 100;
        }
      }));

    const res = [];
    for await (const i of readable) {
      res.push(i);
    }
    assertEquals(res, [0, 100, 200]);
  },
});

Deno.test({
  name: "[streams] toTransformStream() Pass iterable instead of asyncIterable",
  async fn() {
    const readable = readableStreamFromIterable([0, 1, 2])
      .pipeThrough(toTransformStream(function* (_src) {
        yield 0;
        yield 100;
        yield 200;
      }));

    const res = [];
    for await (const i of readable) {
      res.push(i);
    }
    assertEquals(res, [0, 100, 200]);
  },
});

Deno.test({
  name: "[streams] toTransformStream() Propagate the error from readable 1",
  async fn(t) {
    // When data is pipelined in the order of readable1 → generator → readable2,
    // Propagate the error that occurred in readable1 to generator and readable2.
    const expectedError = new Error("Error from readable1");
    await t.step({
      name: "to readable 2",
      async fn() {
        // Propagate the error that occurred in readable1 to readable2.
        let actualError = null;

        const readable1 = new ReadableStream({
          start(controller) {
            controller.error(expectedError); // error from readable1
          },
        });
        const readable2 = readable1.pipeThrough(
          toTransformStream(async function* (src) {
            for await (const i of src) {
              yield i;
            }
          }),
        );

        try {
          await readable2.getReader().read();
        } catch (error) {
          actualError = error; // catch error in readable2
        }

        assertEquals(actualError, expectedError);
      },
    });
    await t.step({
      name: "to generator",
      async fn() {
        // Propagate the error that occurred in readable1 to generator.
        let actualError = null;

        const readable1 = new ReadableStream({
          start(controller) {
            controller.error(expectedError); // error from readable1
          },
        });
        const readable2 = readable1.pipeThrough(
          toTransformStream(async function* (src) {
            try {
              await src.getReader().read();
            } catch (error) {
              actualError = error; // catch error in generator
            }
            yield 0;
          }),
        );

        await readable2.getReader().read();
        assertEquals(actualError, expectedError);
      },
    });
  },
});

Deno.test({
  name: "[streams] toTransformStream() Propagate the error from generator",
  async fn(t) {
    // When data is pipelined in the order of readable1 → generator → readable2,
    // Propagate the error that occurred in generator to readable2 and readable1.
    const expectedError = new Error("Error from generator");
    let actualError1: unknown = null;
    let actualError2: unknown = null;

    const readable1 = new ReadableStream({
      cancel(reason) {
        actualError1 = reason; // catch error in readable1
      },
    });
    const readable2 = readable1.pipeThrough(
      // deno-lint-ignore require-yield
      toTransformStream(function* () {
        throw expectedError; // error from generator
      }),
    );

    try {
      await readable2.getReader().read();
    } catch (error) {
      actualError2 = error; // catch error in readable2
    }

    await t.step({
      name: "to readable 1",
      fn() {
        assertEquals(actualError1, expectedError);
      },
    });
    await t.step({
      name: "to readable 2",
      fn() {
        assertEquals(actualError2, expectedError);
      },
    });
  },
});

Deno.test({
  name: "[streams] toTransformStream() Propagate cancellation from readable 2",
  async fn(t) {
    // When data is pipelined in the order of readable1 → generator → readable2,
    // Propagate the cancellation that occurred in readable2 to readable1 and generator.
    const expectedError = new Error("Error from readable2");
    await t.step({
      name: "to readable 1",
      async fn() {
        let actualError = null;

        const readable1 = new ReadableStream({
          cancel(reason) {
            actualError = reason; // catch error in readable1
          },
        });
        const readable2 = readable1.pipeThrough(
          toTransformStream(function* () {
            yield 0;
          }),
        );

        await readable2.cancel(expectedError); // cancellation from readable2
        assertEquals(actualError, expectedError);
      },
    });
    await t.step({
      name: "to readable 2",
      async fn() {
        let actualError = null;

        const readable1 = new ReadableStream();
        const readable2 = readable1.pipeThrough(
          toTransformStream(function* () {
            try {
              yield 0;
            } catch (error) {
              actualError = error; // catch error in generator
            }
          }),
        );

        const reader = readable2.getReader();
        await reader.read();
        await reader.cancel(expectedError); // cancellation from readable2
        assertEquals(actualError, expectedError);
      },
    });
  },
});

Deno.test({
  name:
    "[streams] toTransformStream() Cancel streams with the correct error message",
  async fn() {
    const src = readableStreamFromIterable([0, 1, 2]);
    // deno-lint-ignore require-yield
    const transform = toTransformStream(function* (src) {
      src.getReader(); // lock the source stream to cause error at cancel
      throw new Error("foo");
    });

    await assertRejects(
      async () => {
        for await (const _ of src.pipeThrough(transform));
      },
      Error,
      "foo",
    );
  },
});

class MockReaderCloser implements Deno.Reader, Deno.Closer {
  chunks: Uint8Array[] = [];
  closeCall = 0;

  read(p: Uint8Array): Promise<number | null> {
    if (this.closeCall) {
      throw new Error("already closed");
    }
    if (p.length === 0) {
      return Promise.resolve(0);
    }
    const chunk = this.chunks.shift();
    if (chunk) {
      const copied = copyBytes(chunk, p);
      if (copied < chunk.length) {
        this.chunks.unshift(chunk.subarray(copied));
      }
      return Promise.resolve(copied);
    }
    return Promise.resolve(null);
  }

  close() {
    this.closeCall++;
  }
}

Deno.test("[streams] readableStreamFromReader()", async function () {
  const encoder = new TextEncoder();
  const reader = new Buffer(encoder.encode("hello deno land"));
  const stream = readableStreamFromReader(reader);
  const actual: Uint8Array[] = [];
  for await (const read of stream) {
    actual.push(read);
  }
  const decoder = new TextDecoder();
  assertEquals(decoder.decode(concat(...actual)), "hello deno land");
});

Deno.test({
  name: "[streams] readableStreamFromReader() auto closes closer",
  async fn() {},
});

Deno.test("[streams] readableStreamFromReader() - calls close", async function () {
  const encoder = new TextEncoder();
  const reader = new MockReaderCloser();
  reader.chunks = [
    encoder.encode("hello "),
    encoder.encode("deno "),
    encoder.encode("land"),
  ];
  const stream = readableStreamFromReader(reader);
  const actual: Uint8Array[] = [];
  for await (const read of stream) {
    actual.push(read);
  }
  const decoder = new TextDecoder();
  assertEquals(decoder.decode(concat(...actual)), "hello deno land");
  assertEquals(reader.closeCall, 1);
});

Deno.test("[streams] readableStreamFromReader() - doesn't call close with autoClose false", async function () {
  const encoder = new TextEncoder();
  const reader = new MockReaderCloser();
  reader.chunks = [
    encoder.encode("hello "),
    encoder.encode("deno "),
    encoder.encode("land"),
  ];
  const stream = readableStreamFromReader(reader, { autoClose: false });
  const actual: Uint8Array[] = [];
  for await (const read of stream) {
    actual.push(read);
  }
  const decoder = new TextDecoder();
  assertEquals(decoder.decode(concat(...actual)), "hello deno land");
  assertEquals(reader.closeCall, 0);
});

Deno.test("[streams] readableStreamFromReader() - chunkSize", async function () {
  const encoder = new TextEncoder();
  const reader = new MockReaderCloser();
  reader.chunks = [
    encoder.encode("hello "),
    encoder.encode("deno "),
    encoder.encode("land"),
  ];
  const stream = readableStreamFromReader(reader, { chunkSize: 2 });
  const actual: Uint8Array[] = [];
  for await (const read of stream) {
    actual.push(read);
  }
  const decoder = new TextDecoder();
  assertEquals(actual.length, 8);
  assertEquals(decoder.decode(concat(...actual)), "hello deno land");
  assertEquals(reader.closeCall, 1);
});

// N controls how many iterations of certain checks are performed.
const N = 100;
let testBytes: Uint8Array | null;

export function init() {
  if (testBytes == null) {
    testBytes = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      testBytes[i] = "a".charCodeAt(0) + (i % 26);
    }
  }
}

Deno.test("testReadAll", async () => {
  init();
  assert(testBytes);
  const reader = new Buffer(testBytes.buffer);
  const actualBytes = await readAll(reader);
  assertEquals(testBytes.byteLength, actualBytes.byteLength);
  for (let i = 0; i < testBytes.length; ++i) {
    assertEquals(testBytes[i], actualBytes[i]);
  }
});

Deno.test("testReadAllSync", () => {
  init();
  assert(testBytes);
  const reader = new Buffer(testBytes.buffer);
  const actualBytes = readAllSync(reader);
  assertEquals(testBytes.byteLength, actualBytes.byteLength);
  for (let i = 0; i < testBytes.length; ++i) {
    assertEquals(testBytes[i], actualBytes[i]);
  }
});

Deno.test("testwriteAll", async () => {
  init();
  assert(testBytes);
  const writer = new Buffer();
  await writeAll(writer, testBytes);
  const actualBytes = writer.bytes();
  assertEquals(testBytes.byteLength, actualBytes.byteLength);
  for (let i = 0; i < testBytes.length; ++i) {
    assertEquals(testBytes[i], actualBytes[i]);
  }
});

Deno.test("testWriteAllSync", () => {
  init();
  assert(testBytes);
  const writer = new Buffer();
  writeAllSync(writer, testBytes);
  const actualBytes = writer.bytes();
  assertEquals(testBytes.byteLength, actualBytes.byteLength);
  for (let i = 0; i < testBytes.length; ++i) {
    assertEquals(testBytes[i], actualBytes[i]);
  }
});

Deno.test("iterateReader", async () => {
  // ref: https://github.com/denoland/deno/issues/2330
  const encoder = new TextEncoder();

  class TestReader implements Deno.Reader {
    #offset = 0;
    #buf: Uint8Array;

    constructor(s: string) {
      this.#buf = new Uint8Array(encoder.encode(s));
    }

    read(p: Uint8Array): Promise<number | null> {
      const n = Math.min(p.byteLength, this.#buf.byteLength - this.#offset);
      p.set(this.#buf.slice(this.#offset, this.#offset + n));
      this.#offset += n;

      if (n === 0) {
        return Promise.resolve(null);
      }

      return Promise.resolve(n);
    }
  }

  const reader = new TestReader("hello world!");

  let totalSize = 0;
  for await (const buf of iterateReader(reader)) {
    totalSize += buf.byteLength;
  }

  assertEquals(totalSize, 12);
});

Deno.test("iterateReaderSync", () => {
  // ref: https://github.com/denoland/deno/issues/2330
  const encoder = new TextEncoder();

  class TestReader implements Deno.ReaderSync {
    #offset = 0;
    #buf: Uint8Array;

    constructor(s: string) {
      this.#buf = new Uint8Array(encoder.encode(s));
    }

    readSync(p: Uint8Array): number | null {
      const n = Math.min(p.byteLength, this.#buf.byteLength - this.#offset);
      p.set(this.#buf.slice(this.#offset, this.#offset + n));
      this.#offset += n;

      if (n === 0) {
        return null;
      }

      return n;
    }
  }

  const reader = new TestReader("hello world!");

  let totalSize = 0;
  for (const buf of iterateReaderSync(reader)) {
    totalSize += buf.byteLength;
  }

  assertEquals(totalSize, 12);
});
