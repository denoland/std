// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Buffer } from "../buffer.ts";
import { assert } from "../../testing/asserts.ts";
import { ERR_INVALID_ARG_VALUE } from "../_errors.ts";

type readOptions = {
  buffer: Buffer | Uint8Array;
  offset: number;
  length: number;
  position: number | null;
};

type BinaryCallback = (
  err: Error | null,
  bytesRead: number | null,
  data?: Buffer,
) => void;
type Callback = BinaryCallback;

export function read(fd: number, callback: Callback): void;
export function read(
  fd: number,
  options: readOptions,
  callback: Callback,
): void;
export function read(
  fd: number,
  buffer: Buffer | Uint8Array,
  offset: number,
  length: number,
  position: number | null,
  callback: Callback,
): void;
export function read(
  fd: number,
  optOrBuffer?: Buffer | Uint8Array | readOptions | Callback,
  offsetOrCallback?: number | Callback,
  length?: number,
  position?: number | null,
  callback?: Callback,
): void {
  let cb: Callback | undefined;
  let offset: number = 0,
    buffer: Buffer | Uint8Array;

  if (length == null) {
    length = 0;
  }

  if (typeof offsetOrCallback === "function") {
    cb = offsetOrCallback;
  } else if (typeof optOrBuffer === "undefined") {
    cb = optOrBuffer;
  } else {
    offset = offsetOrCallback as number;
    cb = callback;
  }

  if (optOrBuffer instanceof Buffer || optOrBuffer instanceof Uint8Array) {
    buffer = optOrBuffer;
  } else if (typeof optOrBuffer === "function") {
    offset = 0;
    buffer = Buffer.alloc(16384);
    length = buffer.byteLength;
    position = null;
  } else {
    let opt = optOrBuffer as readOptions;
    offset = opt.offset;
    buffer = opt.buffer;
    position = opt.position;
    length = opt.length;
  }

  assert(offset >= 0, "offset should be greater or equal to 0");
  assert(
    offset + length <= buffer.byteLength,
    `buffer doesn't have enough data: byteLength = ${buffer.byteLength}, offset + length = ${
      offset + length
    }`,
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

  if (cb) {
    if (err) {
      (callback as (err: Error) => void)(err);
    } else {
      const data = Buffer.from(buffer.buffer, offset, length);
      cb(null, numberOfBytesRead, data);
    }
  }

  return;
}
