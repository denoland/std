import randomBytes from "./randomBytes.ts";
import { Buffer } from "../buffer.ts";

export default function randomFill(
  buf: Buffer,
  cb: (err: Error | null, buf?: Buffer) => void,
): void;
export default function randomFill(
  buf: Buffer,
  offset: number,
  cb: (err: Error | null, buf?: Buffer) => void,
): void;
export default function randomFill(
  buf: Buffer,
  offset: number,
  size: number,
  cb: (err: Error | null, buf?: Buffer) => void,
): void;

export default function randomFill(
  buf: Buffer,
  // deno-lint-ignore no-explicit-any
  offset?: any,
  // deno-lint-ignore no-explicit-any
  size?: any,
  cb?: (err: Error | null, buf?: Buffer) => void,
) {
  if (size + offset > buf.length) {
    throw new RangeError(
      `The value of "size + offset" is out of range. It must be <= ${buf.length}. Received ${(size +
        offset)}.`,
    );
  }

  const buffer = buf as Buffer;
  const callback = cb as (err: Error | null, buf?: Buffer) => void;
  const trueOffset = 0 | offset;
  const trueSize = buffer.length - trueOffset;

  randomBytes(size, (err, buf) => {
    if (err) return callback(err as Error);
    buffer.copy(buf as Buffer, trueOffset, 0, trueSize);
    callback(null, buffer);
  });
}

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
