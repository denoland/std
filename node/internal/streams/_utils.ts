// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { Buffer } from "../../buffer.ts";

export function _uint8ArrayToBuffer(chunk: Uint8Array) {
  return Buffer.from(
    chunk.buffer,
    chunk.byteOffset,
    chunk.byteLength,
  );
}
