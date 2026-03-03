// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Streaming XML parser with callback-based API for maximum throughput.
 *
 * @module
 */

import type { ParseStreamOptions, XmlEventCallbacks } from "./types.ts";
import { XmlTokenizer } from "./_tokenizer.ts";
import { XmlEventParser } from "./_parser.ts";

export type { ParseStreamOptions, XmlEventCallbacks } from "./types.ts";

/**
 * Parse XML from a stream with maximum throughput using direct callbacks.
 *
 * This function provides the highest performance streaming XML parsing by
 * invoking callbacks directly without creating intermediate event objects.
 * Use this when you need maximum throughput and are comfortable with the
 * callback-based API.
 *
 * @example Collecting data from elements
 * ```ts
 * import { parseXmlStream } from "@std/xml/parse-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const xml = `<root><item id="1">First</item><item id="2">Second</item></root>`;
 * const stream = ReadableStream.from([xml]);
 *
 * const items: string[] = [];
 * let currentText = "";
 * let inItem = false;
 *
 * await parseXmlStream(stream, {
 *   onStartElement(name) {
 *     if (name === "item") {
 *       inItem = true;
 *       currentText = "";
 *     }
 *   },
 *   onText(text) {
 *     if (inItem) currentText += text;
 *   },
 *   onEndElement(name) {
 *     if (name === "item") {
 *       items.push(currentText);
 *       inItem = false;
 *     }
 *   },
 * });
 *
 * assertEquals(items, ["First", "Second"]);
 * ```
 *
 * @param source The async iterable of XML string chunks to parse.
 * @param callbacks The event callbacks invoked during parsing.
 * @param options Options for configuring the parser.
 * @returns A promise that resolves when parsing is complete.
 */
export async function parseXmlStream(
  source: AsyncIterable<string>,
  callbacks: XmlEventCallbacks,
  options: ParseStreamOptions = {},
): Promise<void> {
  const trackPosition = options.trackPosition ?? false;
  const tokenizer = new XmlTokenizer({ trackPosition });
  const parser = new XmlEventParser(callbacks, options);

  for await (const chunk of source) {
    tokenizer.process(chunk, parser);
  }
  tokenizer.finalize(parser);
  parser.finalize();
}

/**
 * Parse XML from a byte stream with maximum throughput using direct callbacks.
 *
 * This is a convenience wrapper around {@linkcode parseXmlStream} that handles
 * text decoding. For pre-decoded text streams, use `parseXmlStream` directly.
 *
 * @example Basic usage
 * ```ts
 * import { parseXmlStreamFromBytes } from "@std/xml/parse-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const xml = new TextEncoder().encode("<root>Hello</root>");
 * const stream = ReadableStream.from([xml]);
 *
 * let text = "";
 * await parseXmlStreamFromBytes(stream, {
 *   onText(t) { text += t; },
 * });
 *
 * assertEquals(text, "Hello");
 * ```
 *
 * @param source The async iterable of XML byte chunks to parse.
 * @param callbacks The event callbacks invoked during parsing.
 * @param options Options for configuring the parser.
 * @returns A promise that resolves when parsing is complete.
 */
export function parseXmlStreamFromBytes(
  source: AsyncIterable<Uint8Array>,
  callbacks: XmlEventCallbacks,
  options: ParseStreamOptions = {},
): Promise<void> {
  const textStream = decodeAsyncIterable(source);
  return parseXmlStream(textStream, callbacks, options);
}

/** Helper to decode an AsyncIterable of bytes to strings. */
async function* decodeAsyncIterable(
  source: AsyncIterable<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  for await (const chunk of source) {
    yield decoder.decode(chunk, { stream: true });
  }
  // Flush any remaining bytes
  const final = decoder.decode();
  if (final) yield final;
}
