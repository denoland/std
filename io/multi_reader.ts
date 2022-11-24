// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Based on https://github.com/golang/go/blob/0452f9460f50f0f0aba18df43dc2b31906fb66cc/src/io/io.go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

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
