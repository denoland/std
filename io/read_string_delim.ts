// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import type { Reader } from "./types.d.ts";
import { readDelim } from "./read_delim.ts";

/** Read delimited strings from a Reader. */
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
