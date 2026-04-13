// Copyright 2018-2026 the Deno authors. MIT license.

export const MIN_READ_BUFFER_SIZE = 16;
export const bufsizes = [
  0,
  MIN_READ_BUFFER_SIZE,
  23,
  32,
  46,
  64,
  93,
  128,
  1024,
  4096,
];

// N controls how many iterations of certain checks are performed.
const N = 100;

export function init(): Uint8Array {
  const testBytes = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    testBytes[i] = "a".charCodeAt(0) + (i % 26);
  }
  return testBytes;
}
