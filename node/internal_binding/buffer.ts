import { Encodings } from "./_node.ts";
import { indexOf } from "../../bytes/mod.ts";

export function numberToBytes(n: number) {
  const byteArray = new Uint8Array();

  if (!n) return byteArray;

  const bytes = [];
  bytes.unshift(n & 255);
  while (n >= 256) {
    n = n >>> 8;
    bytes.unshift(n & 255);
  }
  return new Uint8Array(bytes);
}

function indexOfBuffer(
  targetBuffer: Uint8Array,
  buffer: Uint8Array,
  byteOffset: number,
  encoding: Encodings,
  forward_direction: boolean,
) {
  if (!Encodings[encoding] === undefined) {
    throw new Error(`Unknown encoding code ${encoding}`);
  }

  if (!forward_direction) {
    if (buffer.length === 0) {
      return byteOffset <= targetBuffer.length
        ? byteOffset
        : targetBuffer.length;
    }

    return indexOf(targetBuffer, buffer, byteOffset);
  }

  if (buffer.length === 0) {
    return byteOffset <= targetBuffer.length ? byteOffset : targetBuffer.length;
  }

  return indexOf(targetBuffer, buffer, byteOffset);
}

function indexOfNumber(
  targetBuffer: Uint8Array,
  number: number,
  byteOffset: number,
  dir: boolean,
) {
  return indexOf(
    targetBuffer,
    numberToBytes(number),
    byteOffset,
  );
}

export default { indexOfBuffer, indexOfNumber };
export { indexOfBuffer, indexOfNumber };
