// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { TextLineStream as _TextLineStream } from "./text_line_stream.ts";
import { DelimiterStream as _DelimiterStream } from "./delimiter_stream.ts";
import { TextDelimiterStream as _TextDelimiterStream } from "./text_delimiter_stream.ts";

/**
 * @deprecated (will be removed after 0.169.0) Import from `std/streams/text_line_stream.ts` instead.
 *
 * Transform a stream into a stream where each chunk is divided by a newline,
 * be it `\n` or `\r\n`. `\r` can be enabled via the `allowCR` option.
 *
 * @example
 * ```ts
 * import { TextLineStream } from "https://deno.land/std@$STD_VERSION/streams/delimiter.ts";
 * const res = await fetch("https://example.com");
 * const lines = res.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new TextLineStream());
 * ```
 */
export const TextLineStream = _TextLineStream;

/**
 * @deprecated (will be removed after 0.169.0) Import from `std/streams/delimiter_stream.ts` instead.
 *
 * Transform a stream into a stream where each chunk is divided by a given delimiter.
 *
 * @example
 * ```ts
 * import { DelimiterStream } from "https://deno.land/std@$STD_VERSION/streams/delimiter.ts";
 * const res = await fetch("https://example.com");
 * const parts = res.body!
 *   .pipeThrough(new DelimiterStream(new TextEncoder().encode("foo")))
 *   .pipeThrough(new TextDecoderStream());
 * ```
 */
export const DelimiterStream = _DelimiterStream;

/**
 * @deprecated (will be removed after 0.169.0) Import from `std/streams/delimiter_stream.ts` instead.
 *
 * Transform a stream into a stream where each chunk is divided by a given delimiter.
 *
 * @example
 * ```ts
 * import { TextDelimiterStream } from "https://deno.land/std@$STD_VERSION/streams/delimiter.ts";
 * const res = await fetch("https://example.com");
 * const parts = res.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new TextDelimiterStream("foo"));
 * ```
 */
export const TextDelimiterStream = _TextDelimiterStream;
