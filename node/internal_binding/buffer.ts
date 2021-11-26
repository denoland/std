import { Encodings } from "./_node.ts";

class NOT_IMPLEMENTED extends Error {}

function indexOfBuffer(
  targetBuffer: Uint8Array,
  buffer: Uint8Array,
  byteOffset: number,
  encoding: Encodings,
  dir: boolean,
) {
  if (!Encodings[encoding] === undefined) {
    throw new Error(`Unknown encoding code ${encoding}`);
  }

  throw new NOT_IMPLEMENTED();
}

function indexOfString(
  buffer: Uint8Array,
  str: string,
  byteOffset: number,
  encoding: Encodings,
  dir: boolean,
) {
  if (!Encodings[encoding] === undefined) {
    throw new Error(`Unknown encoding code ${encoding}`);
  }

  throw new NOT_IMPLEMENTED();
}

export default { indexOfBuffer, indexOfString };
export { indexOfBuffer, indexOfString };
