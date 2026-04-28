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
 * Parses an async iterable of XML chunks and yields application-defined
 * records as they are assembled by the user's event callbacks.
 *
 * The user builds records in normal XML event callbacks and calls `emit(record)`
 * whenever a complete record has been assembled. Records emitted during a
 * single chunk are yielded one-by-one, so a slow consumer applies backpressure
 * per record. Memory is bounded by the records produced by a single chunk:
 * size input chunks accordingly when records are large or expensive to consume.
 *
 * For pipeline composition with `pipeThrough`, wrap the result with
 * {@linkcode ReadableStream.from}.
 *
 * @example Parse items from an XML feed
 * ```ts
 * import { parseXmlRecords } from "@std/xml/parse-records";
 * import { assertEquals } from "@std/assert";
 *
 * const xml = `<feed>
 *   <item><title>First</title></item>
 *   <item><title>Second</title></item>
 * </feed>`;
 *
 * type Item = { title: string };
 * const records: Item[] = [];
 *
 * const iter = parseXmlRecords<Item>(
 *   ReadableStream.from([xml]),
 *   (emit) => {
 *     let insideItem = false;
 *     let insideTitle = false;
 *     let title = "";
 *     return {
 *       onStartElement(name) {
 *         if (name === "item") { insideItem = true; title = ""; }
 *         else if (insideItem && name === "title") insideTitle = true;
 *       },
 *       onText(text) {
 *         if (insideTitle) title += text;
 *       },
 *       onEndElement(name) {
 *         if (name === "title") insideTitle = false;
 *         if (name === "item") { emit({ title }); insideItem = false; }
 *       },
 *     };
 *   },
 *   { ignoreWhitespace: true },
 * );
 *
 * for await (const record of iter) records.push(record);
 *
 * assertEquals(records, [{ title: "First" }, { title: "Second" }]);
 * ```
 *
 * @example Compose with `pipeThrough` via {@linkcode ReadableStream.from}
 * ```ts
 * import { parseXmlRecords } from "@std/xml/parse-records";
 * import { assertEquals } from "@std/assert";
 *
 * const xml = "<root><id>1</id><id>2</id></root>";
 *
 * const records = ReadableStream.from(
 *   parseXmlRecords<string>(
 *     ReadableStream.from([xml]),
 *     (emit) => {
 *       let inside = false;
 *       let text = "";
 *       return {
 *         onStartElement(name) {
 *           if (name === "id") { inside = true; text = ""; }
 *         },
 *         onText(t) { if (inside) text += t; },
 *         onEndElement(name) {
 *           if (name === "id") { emit(text); inside = false; }
 *         },
 *       };
 *     },
 *   ),
 * );
 *
 * const collected: string[] = [];
 * await records.pipeTo(
 *   new WritableStream({ write(r) { collected.push(r); } }),
 * );
 * assertEquals(collected, ["1", "2"]);
 * ```
 *
 * @typeParam T The type of records yielded by the generator.
 * @param source An async iterable of XML string chunks (e.g. a decoded
 * `ReadableStream` or `parseXmlStreamFromBytes`-compatible source).
 * @param createCallbacks Factory invoked once with an `emit` function; returns
 * the SAX-style callbacks that build records and call `emit` per completed
 * record.
 * @param options Parser options forwarded to the underlying tokenizer/parser.
 * @returns An async generator that yields records as the document is parsed.
 */
export async function* parseXmlRecords<T>(
  source: AsyncIterable<string>,
  createCallbacks: (emit: (record: T) => void) => XmlEventCallbacks,
  options: ParseStreamOptions = {},
): AsyncGenerator<T> {
  const buffer: T[] = [];
  const callbacks = createCallbacks((record) => buffer.push(record));
  const { tokenizer, parser } = createXmlPipeline(options, callbacks);

  for await (const chunk of source) {
    tokenizer.process(chunk, parser);
    while (buffer.length > 0) yield buffer.shift()!;
  }
  tokenizer.finalize(parser);
  parser.finalize();
  while (buffer.length > 0) yield buffer.shift()!;
}
