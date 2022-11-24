// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import type { Reader } from "./types.d.ts";

export class BinaryReader implements Reader {
  index = 0;

  constructor(private bytes: Uint8Array = new Uint8Array(0)) {}

  read(p: Uint8Array): Promise<number | null> {
    p.set(this.bytes.subarray(this.index, p.byteLength));
    this.index += p.byteLength;
    return Promise.resolve(p.byteLength);
  }
}
