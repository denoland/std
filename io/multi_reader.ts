// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { Reader } from "./types.ts";

/**
 * Reader utility for combining multiple readers
 *
 * @deprecate (will be removed in 0.215.0) Use
 * {@linkcode https://deno.land/std/io/to_readable_stream.ts | toReadableStream}
 * and {@linkcode https://deno.land/std/streams/merge_readable_streams | mergeReadableStreams}
 * instead.
 */
export class MultiReader implements Reader {
  readonly #readers: Reader[];
  #currentIndex = 0;

  constructor(readers: Reader[]) {
    this.#readers = [...readers];
  }

  async read(p: Uint8Array): Promise<number | null> {
    const r = this.#readers[this.#currentIndex];
    if (!r) return null;
    const result = await r.read(p);
    if (result === null) {
      this.#currentIndex++;
      return 0;
    }
    return result;
  }
}
