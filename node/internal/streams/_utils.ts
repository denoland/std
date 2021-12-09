import { Buffer } from "../../buffer.ts";

export function _uint8ArrayToBuffer(chunk: Uint8Array) {
  return Buffer.from(
    chunk.buffer,
    chunk.byteOffset,
    chunk.byteLength,
  );
}
