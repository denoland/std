// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Async-generator adapter that turns an XML chunk source into a stream of
 * application-defined records assembled inside SAX-style event callbacks.
 *
 * @module
 */

import type { ParseStreamOptions, XmlEventCallbacks } from "./types.ts";
import { createXmlPipeline } from "./_pipeline.ts";

/**
 * Parses an async iterable of XML chunks and yields records assembled inside
 * SAX-style event callbacks.
 *
 * Each input chunk is parsed synchronously and the records emitted from that
 * chunk are buffered before any are yielded; the consumer then pulls records
 * one at a time. Yield rate (and downstream backpressure) is per-record while
 * peak memory is bounded by the records produced by a single chunk.
 *
 * If parsing throws (XML syntax error or a user callback that throws), the
 * iteration rejects immediately; records buffered within the failing chunk
 * are discarded. Records yielded by earlier chunks remain visible.
 *
 * For `pipeThrough` composition, wrap the result with
 * {@linkcode ReadableStream.from}.
 *
 * @typeParam T The type of records yielded by the generator.
 *
 * @param source An async iterable of XML string chunks (e.g. a
 * `ReadableStream<Uint8Array>` piped through {@linkcode TextDecoderStream}).
 *
 * @param createCallbacks Factory invoked once with an `emit` function; returns
 * the SAX-style callbacks that build records and call `emit` per completed
 * record.
 *
 * @param options Parser options forwarded to the underlying tokenizer/parser.
 *
 * @returns An async generator that yields records as the document is parsed.
 *
 * @example Parse items from an XML feed
 * ```ts
 * import { parseXmlRecords } from "@std/xml/parse-records";
 * import { assertEquals } from "@std/assert";
 *
 * const xml = "<feed><item>First</item><item>Second</item></feed>";
 *
 * const titles: string[] = [];
 * for await (
 *   const title of parseXmlRecords<string>(
 *     ReadableStream.from([xml]),
 *     (emit) => {
 *       let inside = false;
 *       let text = "";
 *       return {
 *         onStartElement(name) {
 *           if (name === "item") {
 *             inside = true;
 *             text = "";
 *           }
 *         },
 *         onText(t) {
 *           if (inside) text += t;
 *         },
 *         onEndElement(name) {
 *           if (name === "item") {
 *             emit(text);
 *             inside = false;
 *           }
 *         },
 *       };
 *     },
 *   )
 * ) {
 *   titles.push(title);
 * }
 *
 * assertEquals(titles, ["First", "Second"]);
 * ```
 */
export async function* parseXmlRecords<T>(
  source: AsyncIterable<string>,
  createCallbacks: (emit: (record: T) => void) => XmlEventCallbacks,
  options: ParseStreamOptions = {},
): AsyncGenerator<T> {
  const buffer: T[] = [];
  const callbacks = createCallbacks((record) => buffer.push(record));
  const { tokenizer, parser } = createXmlPipeline(options, callbacks);

  // Fail-fast contract: parse errors propagate immediately and records
  // buffered within the failing chunk are dropped. Wrapping `process` /
  // `finalize` in `try { ... } finally { drain }` is tempting but unsafe —
  // `iter.return()` from a consumer `break` mid-drain silently swallows
  // the pending exception per ECMAScript semantics.
  for await (const chunk of source) {
    tokenizer.process(chunk, parser);
    for (let i = 0; i < buffer.length; i++) yield buffer[i]!;
    buffer.length = 0;
  }
  tokenizer.finalize(parser);
  parser.finalize();
  for (let i = 0; i < buffer.length; i++) yield buffer[i]!;
  buffer.length = 0;
}
