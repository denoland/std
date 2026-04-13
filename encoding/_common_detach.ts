// Copyright 2018-2026 the Deno authors. MIT license.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };

export function detach(
  buffer: Uint8Array_,
  maxSize: number,
): [Uint8Array_, number] {
  const originalSize = buffer.length;
  if (buffer.byteOffset) {
    const b = new Uint8Array(buffer.buffer);
    b.set(buffer);
    buffer = b.subarray(0, originalSize);
  }
  // deno-lint-ignore no-explicit-any
  buffer = new Uint8Array((buffer.buffer as any).transfer(maxSize));
  buffer.set(buffer.subarray(0, originalSize), maxSize - originalSize);
  return [buffer, maxSize - originalSize];
}
