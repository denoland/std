// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { Reader } from "./types.ts";
import { readDelim } from "./read_delim.ts";

/**
 * Read {@linkcode Reader} chunk by chunk, splitting based on delimiter.
 *
 * @example Usage
 * ```ts
 * import { readStringDelim } from "@std/io/read-string-delim";
 * import { assert } from "@std/assert/assert"
 *
 * using fileReader = await Deno.open("README.md");
 *
 * for await (let line of readStringDelim(fileReader, "\n")) {
 *   assert(typeof line === "string");
 * }
 * ```
 *
 * @param reader The reader to read from
 * @param delim The delimiter to split the reader by
 * @param decoderOpts The options
 * @returns The async iterator of strings
 *
 * @deprecated Pipe the readable stream through a
 * {@linkcode https://jsr.io/@std/streams/doc/~/TextDelimiterStream | TextDelimiterStream}
 * instead. This will be removed in 0.225.0.
 */
export async function* readStringDelim(
  reader: Reader,
  delim: string,
  decoderOpts?: {
    encoding?: string;
    fatal?: boolean;
    ignoreBOM?: boolean;
  },
): AsyncIterableIterator<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder(decoderOpts?.encoding, decoderOpts);
  for await (const chunk of readDelim(reader, encoder.encode(delim))) {
    yield decoder.decode(chunk);
  }
}
