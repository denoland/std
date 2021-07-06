// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assert } from "../../testing/asserts.ts";
// This module implements functions in https://github.com/nodejs/node/blob/master/src/node_file.cc

/**
 * Write to the given file from the given buffer asynchronously.
 *
 * Implements async part of WriteBuffer in src/node_file.cc
 * See: https://github.com/nodejs/node/blob/e9ed113/src/node_file.cc#L1818
 *
 * @param fs file descriptor
 * @param buffer the data to write
 * @param offset where in the buffer to start from
 * @param length how much to write
 * @param position if integer, position to write at in the file. if null, write from the current position
 * @param callback callback function
 */
export function writeBuffer(
  _fd: number,
  _buffer: Uint8Array,
  _offset: number,
  _length: number,
  _position: number | null,
  _callback?: (err: Error, n: number) => void,
): void {
  throw new Error("unimplemented!");
}

/**
 * Write to the given file from the given buffer synchronously.
 *
 * Implements sync part of WriteBuffer in src/node_file.cc
 * See: https://github.com/nodejs/node/blob/e9ed113/src/node_file.cc#L1818
 *
 * @param fs file descriptor
 * @param buffer the data to write
 * @param offset where in the buffer to start from
 * @param length how much to write
 * @param position if integer, position to write at in the file. if null, write from the current position
 * @param context context object for passing error number
 */
export function writeBufferSync(
  fd: number,
  buffer: Uint8Array,
  offset: number,
  length: number,
  position: number | null,
  ctx: { errno?: number },
) {
  assert(offset >= 0, "offset should be greater or equal to 0");
  assert(
    offset + length <= buffer.byteLength,
    `buffer doesn't have enough data: byteLength = ${buffer.byteLength}, offset + length = ${offset +
      length}`,
  );
  if (position) {
    Deno.seekSync(fd, position, Deno.SeekMode.Current);
  }
  const subarray = buffer.subarray(offset, offset + length);
  try {
    return Deno.writeSync(fd, subarray);
  } catch (e) {
    ctx.errno = extractOsErrorNumberFromErrorMessage(e);
    return 0;
  }
}

function extractOsErrorNumberFromErrorMessage(e: Error): number {
  const match = e.message.match(/\(os error (\d+)\)/);
  if (match) {
    return +match[1];
  }
  return 255; // Unknown error
}
