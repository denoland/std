import { Encodings } from "./_node.ts";
import { indexOf } from "../../bytes/mod.ts";

// This implementation differs from std's lastIndexOf in the fact that
// it also includes items outside of the offset as long as part of the
// set is contained inside of the offset
function findLastIndex(
  targetBuffer: Uint8Array,
  buffer: Uint8Array,
  offset: number,
) {
  offset = offset > targetBuffer.length ? targetBuffer.length : offset;

  const searchableBuffer = targetBuffer.slice(0, offset + buffer.length);
  // console.log({ buffer, targetBuffer, offset, searchableBuffer });

  let matches = 0;
  let index = -1;
  for (let x = 0; x < searchableBuffer.length; x++) {
    // console.log({
    //   sb: searchableBuffer[searchableBuffer.length - 1 - x],
    //   b: buffer[buffer.length - 1 - matches],
    // });
    if (
      searchableBuffer[searchableBuffer.length - 1 - x] ===
        buffer[buffer.length - 1 - matches]
    ) {
      matches++;
    } else {
      matches = 0;
    }

    if (matches === buffer.length) {
      index = x;
      break;
    }
  }

  if (index === -1) return index;

  return searchableBuffer.length - 1 - index;
}

function indexOfBuffer(
  targetBuffer: Uint8Array,
  buffer: Uint8Array,
  byteOffset: number,
  encoding: Encodings,
  forwardDirection: boolean,
) {
  if (!Encodings[encoding] === undefined) {
    throw new Error(`Unknown encoding code ${encoding}`);
  }

  if (!forwardDirection) {
    // If negative the offset is calculated from the end of the buffer

    if (byteOffset < 0) {
      byteOffset = targetBuffer.length + byteOffset;
    }

    if (buffer.length === 0) {
      return byteOffset <= targetBuffer.length
        ? byteOffset
        : targetBuffer.length;
    }

    return findLastIndex(targetBuffer, buffer, byteOffset);
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
  forwardDirection: boolean,
) {
  if (!forwardDirection) {
    return Uint8Array.prototype.lastIndexOf.call(
      targetBuffer,
      number,
      byteOffset,
    );
  }

  return Uint8Array.prototype.indexOf.call(
    targetBuffer,
    number,
    byteOffset,
  );
}

export default { indexOfBuffer, indexOfNumber };
export { indexOfBuffer, indexOfNumber };
