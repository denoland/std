// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Streaming XML parser that transforms XML text into a stream of XML events.
 *
 * @module
 */

import { toTransformStream } from "@std/streams/to-transform-stream";
import type { ParseStreamOptions, XmlEvent } from "./types.ts";
import { tokenize } from "./_tokenizer.ts";
import { parseTokensToEvents } from "./_parser.ts";

export type { ParseStreamOptions } from "./types.ts";

/**
 * A streaming XML parser that transforms XML text into a stream of event batches.
 *
 * This class implements the `TransformStream` interface, allowing it to be used
 * with the Streams API for processing XML data in a streaming fashion.
 *
 * Events are yielded in batches (arrays) aligned with input chunks for optimal
 * performance. This avoids the significant async overhead of yielding individual
 * events, which can be 100x slower for large files.
 *
 * @example Basic usage
 * ```ts
 * import { XmlParseStream } from "@std/xml/parse-stream";
 *
 * const xml = `<?xml version="1.0"?>
 * <root>
 *   <item id="1">First</item>
 *   <item id="2">Second</item>
 * </root>`;
 *
 * const stream = ReadableStream.from([xml])
 *   .pipeThrough(new XmlParseStream());
 *
 * for await (const batch of stream) {
 *   for (const event of batch) {
 *     if (event.type === "start_element") {
 *       console.log(`Opening: ${event.name.local}`);
 *     }
 *   }
 * }
 * ```
 *
 * @example Parsing from a fetch response
 * ```ts ignore
 * import { XmlParseStream } from "@std/xml/parse-stream";
 *
 * const response = await fetch("https://example.com/feed.xml");
 * const stream = response.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new XmlParseStream());
 *
 * for await (const batch of stream) {
 *   for (const event of batch) {
 *     if (event.type === "start_element") {
 *       console.log(`Opening: ${event.name.local}`);
 *     }
 *   }
 * }
 * ```
 *
 * @example With options
 * ```ts
 * import { XmlParseStream } from "@std/xml/parse-stream";
 *
 * const xml = `<root>
 *   <!-- comment -->
 *   <item>text</item>
 * </root>`;
 *
 * const stream = ReadableStream.from([xml])
 *   .pipeThrough(new XmlParseStream({
 *     ignoreWhitespace: true,
 *     ignoreComments: true,
 *   }));
 *
 * for await (const batch of stream) {
 *   for (const event of batch) {
 *     console.log(event.type); // Only "start_element", "text", "end_element"
 *   }
 * }
 * ```
 */
export class XmlParseStream implements TransformStream<string, XmlEvent[]> {
  /**
   * The writable side of the transform stream.
   *
   * @example Usage
   * ```ts
   * import { XmlParseStream } from "@std/xml/parse-stream";
   * import { assertInstanceOf } from "@std/assert";
   *
   * const stream = new XmlParseStream();
   * assertInstanceOf(stream.writable, WritableStream);
   * ```
   */
  readonly writable: WritableStream<string>;

  /**
   * The readable side of the transform stream.
   *
   * @example Usage
   * ```ts
   * import { XmlParseStream } from "@std/xml/parse-stream";
   * import { assertEquals } from "@std/assert";
   *
   * const parser = new XmlParseStream();
   * const reader = parser.readable.getReader();
   *
   * const writer = parser.writable.getWriter();
   * await writer.write("<root/>");
   * await writer.close();
   *
   * const { value: batch } = await reader.read();
   * assertEquals(batch?.[0]?.type, "start_element");
   * ```
   */
  readonly readable: ReadableStream<XmlEvent[]>;

  /**
   * Constructs a new XmlParseStream.
   *
   * @param options Options for parsing behavior.
   *
   * @example Default options
   * ```ts
   * import { XmlParseStream } from "@std/xml/parse-stream";
   *
   * const stream = new XmlParseStream();
   * ```
   *
   * @example With custom options
   * ```ts
   * import { XmlParseStream } from "@std/xml/parse-stream";
   *
   * const stream = new XmlParseStream({
   *   ignoreWhitespace: true,
   *   ignoreComments: true,
   * });
   * ```
   */
  constructor(options: ParseStreamOptions = {}) {
    const { writable, readable } = toTransformStream(
      async function* (src: ReadableStream<string>): AsyncIterable<XmlEvent[]> {
        // Cast to AsyncIterable for tokenizer - browsers support async iteration on ReadableStream
        // Yield batches directly for optimal performance
        yield* parseTokensToEvents(
          tokenize(src as unknown as AsyncIterable<string>),
          options,
        );
      },
    );
    this.writable = writable;
    this.readable = readable;
  }
}
