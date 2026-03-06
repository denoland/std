// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * XML parsing and serialization for Deno.
 *
 * This module implements a non-validating XML 1.0 parser based on the
 * {@link https://www.w3.org/TR/xml/ | W3C XML 1.0 (Fifth Edition)} specification.
 *
 * ## Parsing APIs
 *
 * Two parsing APIs are provided for different use cases:
 *
 * | API | Use Case | Output |
 * |-----|----------|--------|
 * | {@linkcode parse} | Parse a complete XML string | Document tree |
 * | {@linkcode parseXmlStream} | Streaming with maximum throughput | Direct callbacks |
 *
 * ## Quick Examples
 *
 * ### DOM-style parsing
 *
 * ```ts
 * import { parse } from "@std/xml";
 * import { assertEquals } from "@std/assert";
 *
 * const doc = parse("<root><item>Hello</item></root>");
 * assertEquals(doc.root.name.local, "root");
 * ```
 *
 * ### High-performance streaming with callbacks
 *
 * For maximum throughput when processing large files:
 *
 * ```ts ignore
 * import { parseXmlStream } from "@std/xml";
 *
 * const response = await fetch("https://example.com/feed.xml");
 * const textStream = response.body!.pipeThrough(new TextDecoderStream());
 *
 * let itemCount = 0;
 * await parseXmlStream(textStream, {
 *   onStartElement(name) {
 *     if (name === "item") itemCount++;
 *   },
 * });
 * console.log(`Found ${itemCount} items`);
 * ```
 *
 * ### Streaming with byte streams
 *
 * For convenience with fetch responses:
 *
 * ```ts ignore
 * import { parseXmlStreamFromBytes } from "@std/xml";
 *
 * const response = await fetch("https://example.com/feed.xml");
 *
 * await parseXmlStreamFromBytes(response.body!, {
 *   onStartElement(name) {
 *     console.log(`Element: ${name}`);
 *   },
 * });
 * ```
 *
 * ## Position Tracking
 *
 * Both parsers support optional position tracking (line, column, offset) for
 * debugging and error reporting:
 *
 * - **DOM parser ({@linkcode parse})**: Position tracking is **enabled by default**
 *   to provide detailed error messages. Disable with `{ trackPosition: false }`
 *   for a performance boost when parsing trusted XML.
 *
 * - **Streaming parser ({@linkcode parseXmlStream})**: Position tracking is
 *   **disabled by default** for optimal streaming performance. Enable with
 *   `{ trackPosition: true }` when you need position info.
 *
 * @module
 */

export * from "./types.ts";
export * from "./parse_stream.ts";
export * from "./parse.ts";
export * from "./stringify.ts";
