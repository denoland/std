// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
/**
 * Temporary toAsyncIterator definition until Deno core gets fixed
 *
 * see https://github.com/denoland/deno/issues/2330
 */
export function toAsyncIterator(
  r: Deno.Reader
): AsyncIterableIterator<Uint8Array> {
  const b = new Uint8Array(100);
  let sawEof = false;

  return {
    [Symbol.asyncIterator](): AsyncIterableIterator<Uint8Array> {
      return this;
    },

    async next(): Promise<IteratorResult<Uint8Array>> {
      if (sawEof) {
        return { value: null, done: true };
      }

      const result = await r.read(b);
      sawEof = result.eof;

      return {
        value: b.subarray(0, result.nread),
        done: false
      };
    }
  };
}
