// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/reader_from_iterable.ts` instead.
   *
   * Create a `Deno.Reader` from an iterable of `Uint8Array`s.
   *
   * ```ts
   *      import { readerFromIterable, copy } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
   *
   *      const file = await Deno.open("metrics.txt", { write: true });
   *      const reader = readerFromIterable((async function* () {
   *        while (true) {
   *          await new Promise((r) => setTimeout(r, 1000));
   *          const message = `data: ${JSON.stringify(Deno.metrics())}\n\n`;
   *          yield new TextEncoder().encode(message);
   *        }
   *      })());
   *      await copy(reader, file);
   * ```
   */
  readerFromIterable,
} from "./reader_from_iterable.ts";

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/writer_from_stream_writer.ts` instead.
   *
   * Create a `Writer` from a `WritableStreamDefaultWriter`.
   *
   * @example
   * ```ts
   * import {
   *   copy,
   *   writerFromStreamWriter,
   * } from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
   * const file = await Deno.open("./deno.land.html", { read: true });
   *
   * const writableStream = new WritableStream({
   *   write(chunk): void {
   *     console.log(chunk);
   *   },
   * });
   * const writer = writerFromStreamWriter(writableStream.getWriter());
   * await copy(file, writer);
   * file.close();
   * ```
   */
  writerFromStreamWriter,
} from "./writer_from_stream_writer.ts";

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/reader_from_stream_reader.ts` instead.
   *
   * Create a `Reader` from a `ReadableStreamDefaultReader`.
   *
   * @example
   * ```ts
   * import {
   *   copy,
   *   readerFromStreamReader,
   * } from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
   * const res = await fetch("https://deno.land");
   * const file = await Deno.open("./deno.land.html", { create: true, write: true });
   *
   * const reader = readerFromStreamReader(res.body!.getReader());
   * await copy(reader, file);
   * file.close();
   * ```
   */
  readerFromStreamReader,
} from "./reader_from_stream_reader.ts";

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/writable_stream_from_writer.ts` instead.
   * Create a `WritableStream` from a `Writer`.
   */
  writableStreamFromWriter,
  /** @deprecated (will be removed after 0.171.0) Import from `std/streams/writable_stream_from_writer.ts` instead. */
  type WritableStreamFromWriterOptions,
} from "./writable_stream_from_writer.ts";

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/readable_stream_from_iterable.ts` instead.
   *
   * reate a `ReadableStream` from any kind of iterable.
   *
   * ```ts
   *      import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
   *
   *      const r1 = readableStreamFromIterable(["foo, bar, baz"]);
   *      const r2 = readableStreamFromIterable(async function* () {
   *        await new Promise(((r) => setTimeout(r, 1000)));
   *        yield "foo";
   *        await new Promise(((r) => setTimeout(r, 1000)));
   *        yield "bar";
   *        await new Promise(((r) => setTimeout(r, 1000)));
   *        yield "baz";
   *      }());
   * ```
   *
   * If the produced iterator (`iterable[Symbol.asyncIterator]()` or
   * `iterable[Symbol.iterator]()`) is a generator, or more specifically is found
   * to have a `.throw()` method on it, that will be called upon
   * `readableStream.cancel()`. This is the case for the second input type above:
   *
   * ```ts
   * import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
   *
   * const r3 = readableStreamFromIterable(async function* () {
   *   try {
   *     yield "foo";
   *   } catch (error) {
   *     console.log(error); // Error: Cancelled by consumer.
   *   }
   * }());
   * const reader = r3.getReader();
   * console.log(await reader.read()); // { value: "foo", done: false }
   * await reader.cancel(new Error("Cancelled by consumer."));
   * ```
   */
  readableStreamFromIterable,
} from "./readable_stream_from_iterable.ts";

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/to_transform_stream.ts` instead.
   *
   * Convert the generator function into a TransformStream.
   *
   * ```ts
   * import { readableStreamFromIterable, toTransformStream } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
   *
   * const readable = readableStreamFromIterable([0, 1, 2])
   *   .pipeThrough(toTransformStream(async function* (src) {
   *     for await (const chunk of src) {
   *       yield chunk * 100;
   *     }
   *   }));
   *
   * for await (const chunk of readable) {
   *   console.log(chunk);
   * }
   * // output: 0, 100, 200
   * ```
   *
   * @param transformer A function to transform.
   * @param writableStrategy An object that optionally defines a queuing strategy for the stream.
   * @param readableStrategy An object that optionally defines a queuing strategy for the stream.
   */
  toTransformStream,
} from "./to_transform_stream.ts";

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/readable_stream_from_reader.ts` instead.
   *
   * Create a `ReadableStream<Uint8Array>` from a `Deno.Reader`.
   *
   * When the pull algorithm is called on the stream, a chunk from the reader
   * will be read.  When `null` is returned from the reader, the stream will be
   * closed along with the reader (if it is also a `Deno.Closer`).
   *
   * An example converting a `Deno.FsFile` into a readable stream:
   *
   * ```ts
   * import { readableStreamFromReader } from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
   *
   * const file = await Deno.open("./file.txt", { read: true });
   * const fileStream = readableStreamFromReader(file);
   * ```
   */
  readableStreamFromReader,
  /** @deprecated (will be removed after 0.171.0) Import from `std/streams/readable_stream_from_reader.ts` instead. */
  type ReadableStreamFromReaderOptions,
} from "./readable_stream_from_reader.ts";

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/read_all.ts` instead.
   *
   * Read Reader `r` until EOF (`null`) and resolve to the content as
   * Uint8Array`.
   *
   * ```ts
   * import { Buffer } from "https://deno.land/std@$STD_VERSION/io/buffer.ts";
   * import { readAll } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
   *
   * // Example from stdin
   * const stdinContent = await readAll(Deno.stdin);
   *
   * // Example from file
   * const file = await Deno.open("my_file.txt", {read: true});
   * const myFileContent = await readAll(file);
   * file.close();
   *
   * // Example from buffer
   * const myData = new Uint8Array(100);
   * // ... fill myData array with data
   * const reader = new Buffer(myData.buffer);
   * const bufferContent = await readAll(reader);
   * ```
   */
  readAll,
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/read_all.ts` instead.
   *
   * Synchronously reads Reader `r` until EOF (`null`) and returns the content
   * as `Uint8Array`.
   *
   * ```ts
   * import { Buffer } from "https://deno.land/std@$STD_VERSION/io/buffer.ts";
   * import { readAllSync } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
   *
   * // Example from stdin
   * const stdinContent = readAllSync(Deno.stdin);
   *
   * // Example from file
   * const file = Deno.openSync("my_file.txt", {read: true});
   * const myFileContent = readAllSync(file);
   * file.close();
   *
   * // Example from buffer
   * const myData = new Uint8Array(100);
   * // ... fill myData array with data
   * const reader = new Buffer(myData.buffer);
   * const bufferContent = readAllSync(reader);
   * ```
   */
  readAllSync,
} from "./read_all.ts";

export {
  /**
 * @deprecated (will be removed after 0.171.0) Import from `std/streams/write_all.ts` instead.
 *
 * Write all the content of the array buffer (`arr`) to the writer (`w`).
 *
 * ```ts
 * import { Buffer } from "https://deno.land/std@$STD_VERSION/io/buffer.ts";
 * import { writeAll } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";

 * // Example writing to stdout
 * let contentBytes = new TextEncoder().encode("Hello World");
 * await writeAll(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * contentBytes = new TextEncoder().encode("Hello World");
 * const file = await Deno.open('test.file', {write: true});
 * await writeAll(file, contentBytes);
 * file.close();
 *
 * // Example writing to buffer
 * contentBytes = new TextEncoder().encode("Hello World");
 * const writer = new Buffer();
 * await writeAll(writer, contentBytes);
 * console.log(writer.bytes().length);  // 11
 * ```
 */
  writeAll,
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/write_all.ts` instead.
   *
   * Synchronously write all the content of the array buffer (`arr`) to the
   * writer (`w`).
   *
   * ```ts
   * import { Buffer } from "https://deno.land/std@$STD_VERSION/io/buffer.ts";
   * import { writeAllSync } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
   *
   * // Example writing to stdout
   * let contentBytes = new TextEncoder().encode("Hello World");
   * writeAllSync(Deno.stdout, contentBytes);
   *
   * // Example writing to file
   * contentBytes = new TextEncoder().encode("Hello World");
   * const file = Deno.openSync('test.file', {write: true});
   * writeAllSync(file, contentBytes);
   * file.close();
   *
   * // Example writing to buffer
   * contentBytes = new TextEncoder().encode("Hello World");
   * const writer = new Buffer();
   * writeAllSync(writer, contentBytes);
   * console.log(writer.bytes().length);  // 11
   * ```
   */
  writeAllSync,
} from "./write_all.ts";

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/iterate_reader.ts` instead.
   *
   * Turns a Reader, `r`, into an async iterator.
   *
   * ```ts
   * import { iterateReader } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
   *
   * let f = await Deno.open("/etc/passwd");
   * for await (const chunk of iterateReader(f)) {
   *   console.log(chunk);
   * }
   * f.close();
   * ```
   *
   * Second argument can be used to tune size of a buffer.
   * Default size of the buffer is 32kB.
   *
   * ```ts
   * import { iterateReader } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
   *
   * let f = await Deno.open("/etc/passwd");
   * const it = iterateReader(f, {
   *   bufSize: 1024 * 1024
   * });
   * for await (const chunk of it) {
   *   console.log(chunk);
   * }
   * f.close();
   * ```
   */
  iterateReader,
  /**
 * @deprecated (will be removed after 0.171.0) Import from `std/streams/iterate_reader.ts` instead.
 *
 * Turns a ReaderSync, `r`, into an iterator.
 *
 * ```ts
 * import { iterateReaderSync } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
 *
 * let f = Deno.openSync("/etc/passwd");
 * for (const chunk of iterateReaderSync(f)) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Second argument can be used to tune size of a buffer.
 * Default size of the buffer is 32kB.
 *
 * ```ts
 * import { iterateReaderSync } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";

 * let f = await Deno.open("/etc/passwd");
 * const iter = iterateReaderSync(f, {
 *   bufSize: 1024 * 1024
 * });
 * for (const chunk of iter) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Iterator uses an internal buffer of fixed size for efficiency; it returns
 * a view on that buffer on each iteration. It is therefore caller's
 * responsibility to copy contents of the buffer if needed; otherwise the
 * next iteration will overwrite contents of previously returned chunk.
 */
  iterateReaderSync,
} from "./iterate_reader.ts";

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/copy.ts` instead.
   *
   * Copies from `src` to `dst` until either EOF (`null`) is read from `src` or
   * an error occurs. It resolves to the number of bytes copied or rejects with
   * the first error encountered while copying.
   *
   * ```ts
   * import { copy } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
   *
   * const source = await Deno.open("my_file.txt");
   * const bytesCopied1 = await copy(source, Deno.stdout);
   * const destination = await Deno.create("my_file_2.txt");
   * const bytesCopied2 = await copy(source, destination);
   * ```
   *
   * @param src The source to copy from
   * @param dst The destination to copy to
   * @param options Can be used to tune size of the buffer. Default size is 32kB
   */
  copy,
} from "./copy.ts";
