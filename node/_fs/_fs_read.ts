// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { Buffer } from "../buffer.ts";
import { assert } from "../../testing/asserts.ts";
import { ERR_INVALID_ARG_VALUE } from "../internal/errors.ts";

type readOptions = {
  buffer: Buffer | Uint8Array;
  offset: number;
  length: number;
  position: number | null;
};

type readSyncOptions = {
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
  let offset = 0,
    buffer: Buffer | Uint8Array;

  if (length == null) {
    length = 0;
  }

  if (typeof offsetOrCallback === "function") {
    cb = offsetOrCallback;
  } else if (typeof optOrBuffer === "function") {
    cb = optOrBuffer;
  } else {
    offset = offsetOrCallback as number;
    cb = callback;
  }

  if (!cb) throw new Error("No callback function supplied");

  if (optOrBuffer instanceof Buffer || optOrBuffer instanceof Uint8Array) {
    buffer = optOrBuffer;
  } else if (typeof optOrBuffer === "function") {
    offset = 0;
    buffer = Buffer.alloc(16384);
    length = buffer.byteLength;
    position = null;
  } else {
    const opt = optOrBuffer as readOptions;
    offset = opt.offset ?? 0;
    buffer = opt.buffer ?? Buffer.alloc(16384);
    length = opt.length ?? buffer.byteLength;
    position = opt.position ?? null;
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

  if (err) {
    (callback as (err: Error) => void)(err);
  } else {
    const data = Buffer.from(buffer.buffer, offset, length);
    cb(null, numberOfBytesRead, data);
  }

  return;
}

export function readSync(
  fd: number,
  buffer: Buffer | Uint8Array,
  offset: number,
  length: number,
  position: number | null,
): number;
export function readSync(
  fd: number,
  buffer: Buffer | Uint8Array,
  opt: readSyncOptions,
): number;
export function readSync(
  fd: number,
  buffer: Buffer | Uint8Array,
  offsetOrOpt?: number | readSyncOptions,
  length?: number,
  position?: number | null,
): number {
  let offset = 0;

  if (length == null) {
    length = 0;
  }

  if (buffer.byteLength == 0) {
    throw new ERR_INVALID_ARG_VALUE(
      "buffer",
      buffer,
      "is empty and cannot be written",
    );
  }

  if (typeof offsetOrOpt === "number") {
    offset = offsetOrOpt;
  } else {
    const opt = offsetOrOpt as readSyncOptions;
    offset = opt.offset ?? 0;
    length = opt.length ?? buffer.byteLength;
    position = opt.position ?? null;
  }

  assert(offset >= 0, "offset should be greater or equal to 0");
  assert(
    offset + length <= buffer.byteLength,
    `buffer doesn't have enough data: byteLength = ${buffer.byteLength}, offset + length = ${
      offset + length
    }`,
  );

  if (position) {
    Deno.seekSync(fd, position, Deno.SeekMode.Current);
  }

  const numberOfBytesRead = Deno.readSync(fd, buffer);

  return numberOfBytesRead ?? 0;
}
