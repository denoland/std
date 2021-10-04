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
  offset?: number | ((err: Error | null, buf?: Buffer) => void),
  size?: number | ((err: Error | null, buf?: Buffer) => void),
  cb?: (err: Error | null, buf?: Buffer) => void,
) {
  const callback = cb as (err: Error | null, buf?: Buffer) => void;
  const trueOffset = offset as unknown as number | 0;
  let trueSize = buf.length - trueOffset;

  if (size !== undefined) {
    trueSize = size as number;
  }

  if (trueSize + trueOffset > buf.length) {
    throw new RangeError(
      `The value of "size + offset" is out of range. It must be <= ${buf.length}. Received ${(trueSize +
        trueOffset)}.`,
    );
  }

  randomBytes(trueSize, (err, buf) => {
    if (err) return callback(err as Error);
    buf?.copy(buf as Buffer, trueOffset, 0, trueSize);
    callback(null, buf);
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
