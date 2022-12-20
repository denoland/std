// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { mergeReadableStreams as _mergeReadableStreams } from "./merge_readable_streams.ts";
import { zipReadableStreams as _zipReadableStreams } from "./zip_readable_streams.ts";
import { earlyZipReadableStreams as _earlyZipReadableStreams } from "./early_zip_readable_streams.ts";

/**
 * @deprecated (will be removed after 0.169.0) Import from `std/streams/merge_readable_streams.ts` instead.
 *
 * Merge multiple streams into a single one, not taking order into account.
 * If a stream ends before other ones, the other will continue adding data,
 * and the finished one will not add any more data.
 */
export const mergeReadableStreams = _mergeReadableStreams;

/**
 * @deprecated (will be removed after 0.169.0) Import from `std/streams/zip_readable_streams.ts` instead.
 *
 * Merge multiple streams into a single one, taking order into account, and each stream
 * will wait for a chunk to enqueue before the next stream can append another chunk.
 * If a stream ends before other ones, the others will continue adding data in order,
 * and the finished one will not add any more data.
 */
export const zipReadableStreams = _zipReadableStreams;

/**
 * @deprecated (will be removed after 0.169.0) Import from `std/streams/zip_readable_streams.ts` instead.
 *
 * Merge multiple streams into a single one, taking order into account, and each stream
 * will wait for a chunk to enqueue before the next stream can append another chunk.
 * If a stream ends before other ones, the others will be cancelled.
 */
export const earlyZipReadableStreams = _earlyZipReadableStreams;
