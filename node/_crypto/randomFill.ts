import randomBytes from "./randomBytes.ts";
import { Buffer } from "../buffer.ts";

export function randomFillSync(buffer: Buffer, offset = 0, size?: number) {
  if (size === undefined) {
    size = buffer.length - offset;
  }

  if (size + offset > buffer.length) {
    throw new RangeError(
      `The value of "size + offset" is out of range. It must be <= ${buffer.length}. Received ${(size +
        offset)}.`,
    );
  }

  randomBytes(size).copy(buffer, offset, 0, size);
}
