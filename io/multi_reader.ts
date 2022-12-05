// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

/** Reader utility for combining multiple readers */
export class MultiReader implements Deno.Reader {
  readonly #readers: Deno.Reader[];
  #currentIndex = 0;

  constructor(readers: Deno.Reader[]) {
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
