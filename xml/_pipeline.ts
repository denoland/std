// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal helper for constructing the tokenizer + parser pair that drives
 * both {@linkcode parseXmlStream} and {@linkcode parseXmlRecords}.
 *
 * @module
 */

import type { ParseStreamOptions, XmlEventCallbacks } from "./types.ts";
import { XmlTokenizer } from "./_tokenizer.ts";
import { XmlEventParser } from "./_parser.ts";

/** A configured tokenizer paired with the parser it feeds. */
export interface XmlPipeline {
  /** Tokenizer that consumes raw XML chunks. */
  readonly tokenizer: XmlTokenizer;
  /** Event parser that receives tokens and invokes user callbacks. */
  readonly parser: XmlEventParser;
}

/**
 * Constructs a tokenizer/parser pipeline from {@linkcode ParseStreamOptions}
 * and {@linkcode XmlEventCallbacks}, applying the canonical defaults used by
 * the public streaming APIs.
 *
 * @param options Stream parse options.
 * @param callbacks Event callbacks invoked by the parser.
 * @returns The configured tokenizer and parser.
 */
export function createXmlPipeline(
  options: ParseStreamOptions,
  callbacks: XmlEventCallbacks,
): XmlPipeline {
  const trackPosition = options.trackPosition ?? false;
  const disallowDoctype = options.disallowDoctype ?? true;
  const xml11 = options.xmlVersion === "1.1";
  const tokenizer = new XmlTokenizer({ trackPosition, disallowDoctype, xml11 });
  const parser = new XmlEventParser(callbacks, options, xml11);
  return { tokenizer, parser };
}
