// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { copyN as _copyN } from "./copy_n.ts";
import { readShort as _readShort } from "./read_short.ts";
import { readInt as _readInt } from "./read_int.ts";
import { readLong as _readLong } from "./read_long.ts";
import { sliceLongToBytes as _sliceLongToBytes } from "./slice_long_to_bytes.ts";

/**
 * @deprecated (will be removed after 0.172.0) Import from `std/io/copy_reader.ts` instead
 *
 * Copy N size at the most. If read size is lesser than N, then returns nread
 * @param r Reader
 * @param dest Writer
 * @param size Read size
 */
export const copyN = _copyN;

/**
 * @deprecated (will be removed after 0.172.0) Import from `std/io/read_short.ts` instead
 *
 * Read big endian 16bit short from BufReader
 * @param buf
 */
export const readShort = _readShort;

/**
 * @deprecated (will be removed after 0.172.0) Import from `std/io/read_int.ts` instead
 *
 * Read big endian 32bit integer from BufReader
 * @param buf
 */
export const readInt = _readInt;

/**
 * @deprecated (will be removed after 0.172.0) Import from `std/io/read_long.ts` instead
 *
 * Read big endian 64bit long from BufReader
 * @param buf
 */
export const readLong = _readLong;

/**
 * @deprecated (will be removed after 0.172.0) Import from `std/io/slice_long_to_bytes.ts` instead
 *
 * Slice number into 64bit big endian byte array
 * @param d The number to be sliced
 * @param dest The sliced array
 */
export const sliceLongToBytes = _sliceLongToBytes;
