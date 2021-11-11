// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Buffer } from "../buffer.ts";
import { assert } from "../../testing/asserts.ts";
import { ERR_INVALID_ARG_VALUE } from "../_errors.ts";

type BinaryCallback = (
  err: Error | null,
  bytesRead: number | null,
  data?: Buffer,
) => void;
type Callback = BinaryCallback;

export function read(
  fd: number,
  buffer: Buffer | Uint8Array,
  offset: number,
  length: number,
  position: number | null,
  callback: Callback,
): void {
  assert(offset >= 0, "offset should be greater or equal to 0");
  assert(
    offset + length <= buffer.byteLength,
    `buffer doesn't have enough data: byteLength = ${buffer.byteLength}, offset + length = ${offset +
      length}`,
  );

  if (buffer.byteLength == 0) {
    throw new ERR_INVALID_ARG_VALUE(
      "buffer",
      buffer,
      "is empty and cannot be written",
    );
  }

  let err: Error | null = null,
    numberOfBytesRead: number | null = null;

  if (position) {
    Deno.seekSync(fd, position, Deno.SeekMode.Current);
  }

  try {
    numberOfBytesRead = Deno.readSync(fd, buffer);
  } catch (error) {
    err = error instanceof Error ? error : new Error("[non-error thrown]");
  }

  if (err) {
    (callback as (err: Error) => void)(err);
  } else {
    const data = new Buffer(buffer.buffer, offset, length);
    callback(null, numberOfBytesRead, data);
  }
  return;
}
