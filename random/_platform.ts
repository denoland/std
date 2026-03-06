// Copyright 2018-2026 the Deno authors. MIT license.

export const platform = {
  // settable property for testing purposes
  littleEndian: new Uint8Array(new Uint16Array([1]).buffer)[0] === 1,
};
