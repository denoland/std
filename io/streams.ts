// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { Buffer } from "./buffer.ts";
import { writeAll } from "./util.ts";

const DEFAULT_CHUNK_SIZE = 16_640;

function isCloser(value: unknown): value is Deno.Closer {
  return typeof value === "object" && value != null && "close" in value &&
    // deno-lint-ignore no-explicit-any
    typeof (value as Record<string, any>)["close"] === "function";
}

/** Create a `Deno.Reader` from an iterable of `Uint8Array`s.
 *
 *      // Server-sent events: Send runtime metrics to the client every second.
 *      request.respond({
 *        headers: new Headers({ "Content-Type": "text/event-stream" }),
 *        body: readerFromIterable((async function* () {
 *          while (true) {
 *            await new Promise((r) => setTimeout(r, 1000));
 *            const message = `data: ${JSON.stringify(Deno.metrics())}\n\n`;
 *            yield new TextEncoder().encode(message);
 *          }
 *        })()),
 *      });
 */
export function readerFromIterable(
  iterable: Iterable<Uint8Array> | AsyncIterable<Uint8Array>,
): Deno.Reader {
  const iterator: Iterator<Uint8Array> | AsyncIterator<Uint8Array> =
    (iterable as AsyncIterable<Uint8Array>)[Symbol.asyncIterator]?.() ??
      (iterable as Iterable<Uint8Array>)[Symbol.iterator]?.();
  const buffer = new Buffer();
  return {
    async read(p: Uint8Array): Promise<number | null> {
      if (buffer.length == 0) {
        const result = await iterator.next();
        if (result.done) {
          return null;
        } else {
          if (result.value.byteLength <= p.byteLength) {
            p.set(result.value);
            return result.value.byteLength;
          }
          p.set(result.value.subarray(0, p.byteLength));
          await writeAll(buffer, result.value.subarray(p.byteLength));
          return p.byteLength;
        }
      } else {
        const n = await buffer.read(p);
        if (n == null) {
          return this.read(p);
        }
        return n;
      }
    },
  };
}

/** Create a `Writer` from a `WritableStreamDefaultReader`. */
export function writerFromStreamWriter(
  streamWriter: WritableStreamDefaultWriter<Uint8Array>,
): Deno.Writer {
  return {
    async write(p: Uint8Array): Promise<number> {
      await streamWriter.ready;
      await streamWriter.write(p);
      return p.length;
    },
  };
}

/** Create a `Reader` from a `ReadableStreamDefaultReader`. */
export function readerFromStreamReader(
  streamReader: ReadableStreamDefaultReader<Uint8Array>,
): Deno.Reader {
  const buffer = new Buffer();

  return {
    async read(p: Uint8Array): Promise<number | null> {
      if (buffer.empty()) {
        const res = await streamReader.read();
        if (res.done) {
          return null; // EOF
        }

        await writeAll(buffer, res.value);
      }

      return buffer.read(p);
    },
  };
}

export interface WritableStreamFromWriterOptions {
  /**
   * If the `writer` is also a `Deno.Closer`, automatically close the `writer`
   * when the stream is closed, aborted, or a write error occurs.
   *
   * Defaults to `true`. */
  autoClose?: boolean;
}

/** Create a `WritableStream` from a `Writer`. */
export function writableStreamFromWriter(
  writer: Deno.Writer,
  options: WritableStreamFromWriterOptions = {},
): WritableStream<Uint8Array> {
  const { autoClose = true } = options;

  return new WritableStream({
    async write(chunk, controller) {
      try {
        await writeAll(writer, chunk);
      } catch (e) {
        controller.error(e);
        if (isCloser(writer) && autoClose) {
          writer.close();
        }
      }
    },
    close() {
      if (isCloser(writer) && autoClose) {
        writer.close();
      }
    },
    abort() {
      if (isCloser(writer) && autoClose) {
        writer.close();
      }
    },
  });
}

/** Create a `ReadableStream` from any kind of iterable.
 *
 *      const r1 = readableStreamFromIterable(["foo, bar, baz"]);
 *      const r2 = readableStreamFromIterable((async function* () {
 *        await new Promise(((r) => setTimeout(r, 1000)));
 *        yield "foo";
 *        await new Promise(((r) => setTimeout(r, 1000)));
 *        yield "bar";
 *        await new Promise(((r) => setTimeout(r, 1000)));
 *        yield "baz";
 *      })());
*/
export function readableStreamFromIterable<T>(
  iterable: Iterable<T> | AsyncIterable<T>,
): ReadableStream<T> {
  const iterator: Iterator<T> | AsyncIterator<T> =
    (iterable as AsyncIterable<T>)[Symbol.asyncIterator]?.() ??
      (iterable as Iterable<T>)[Symbol.iterator]?.();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

export interface ReadableStreamFromReaderOptions {
  /** If the `reader` is also a `Deno.Closer`, automatically close the `reader`
   * when `EOF` is encountered, or a read error occurs.
   *
   * Defaults to `true`. */
  autoClose?: boolean;

  /** The size of chunks to allocate to read, the default is ~16KiB, which is
   * the maximum size that Deno operations can currently support. */
  chunkSize?: number;

  /** The queuing strategy to create the `ReadableStream` with. */
  strategy?: { highWaterMark?: number | undefined; size?: undefined };
}

/**
 * Create a `ReadableStream<Uint8Array>` from from a `Deno.Reader`.
 *
 * When the pull algorithm is called on the stream, a chunk from the reader
 * will be read.  When `null` is returned from the reader, the stream will be
 * closed along with the reader (if it is also a `Deno.Closer`).
 *
 * An example converting a `Deno.File` into a readable stream:
 *
 * ```ts
 * import { readableStreamFromReader } from "./mod.ts";
 *
 * const file = await Deno.open("./file.txt", { read: true });
 * const fileStream = readableStreamFromReader(file);
 * ```
 *
 */
export function readableStreamFromReader(
  reader: Deno.Reader | (Deno.Reader & Deno.Closer),
  options: ReadableStreamFromReaderOptions = {},
): ReadableStream<Uint8Array> {
  const {
    autoClose = true,
    chunkSize = DEFAULT_CHUNK_SIZE,
    strategy,
  } = options;

  return new ReadableStream({
    async pull(controller) {
      const chunk = new Uint8Array(chunkSize);
      try {
        const read = await reader.read(chunk);
        if (read === null) {
          if (isCloser(reader) && autoClose) {
            reader.close();
          }
          controller.close();
          return;
        }
        controller.enqueue(chunk.subarray(0, read));
      } catch (e) {
        controller.error(e);
        if (isCloser(reader)) {
          reader.close();
        }
      }
    },
    cancel() {
      if (isCloser(reader) && autoClose) {
        reader.close();
      }
    },
  }, strategy);
}
