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
  optOrBuffer: Buffer | Uint8Array | readOptions,
  offsetOrCallback: number | Callback,
  length?: number,
  position?: number | null,
  callback?: Callback,
): void {
  let cb: Callback | undefined;
  let offset: number = 0,
    buffer: Buffer | Uint8Array;

  if (typeof offsetOrCallback === "function") {
    cb = offsetOrCallback;
  } else {
    offset = offsetOrCallback;
    cb = callback;
  }

  if (optOrBuffer instanceof Buffer) {
    buffer = optOrBuffer;
  } else {
    let opt = optOrBuffer as readOptions;
    offset = opt.offset;
    buffer = opt.buffer;
    position = opt.position;
    length = opt.length;
  }

  if (length == null) {
    length = 0;
  }

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

  if (cb) {
    if (err) {
      (callback as (err: Error) => void)(err);
    } else {
      const data = new Buffer(buffer.buffer, offset, length);
      cb(null, numberOfBytesRead, data);
    }
  }

  return;
}
