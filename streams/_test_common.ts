// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

// N controls how many iterations of certain checks are performed.
const N = 100;

export function init(): Uint8Array {
  const testBytes = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    testBytes[i] = "a".charCodeAt(0) + (i % 26);
  }
  return testBytes;
}
