// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/text_line_stream.ts` instead.
   *
   * Transform a stream into a stream where each chunk is divided by a newline,
   * be it `\n` or `\r\n`. `\r` can be enabled via the `allowCR` option.
   *
   * ```ts
   * import { TextLineStream } from "https://deno.land/std@$STD_VERSION/streams/delimiter.ts";
   * const res = await fetch("https://example.com");
   * const lines = res.body!
   *   .pipeThrough(new TextDecoderStream())
   *   .pipeThrough(new TextLineStream());
   * ```
   */
  TextLineStream,
} from "./text_line_stream.ts";

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/delimiter_stream.ts` instead.
   *
   * Transform a stream into a stream where each chunk is divided by a given delimiter.
   *
   * ```ts
   * import { DelimiterStream } from "https://deno.land/std@$STD_VERSION/streams/delimiter.ts";
   * const res = await fetch("https://example.com");
   * const parts = res.body!
   *   .pipeThrough(new DelimiterStream(new TextEncoder().encode("foo")))
   *   .pipeThrough(new TextDecoderStream());
   * ```
   */
  DelimiterStream,
} from "./delimiter_stream.ts";

export {
  /**
   * @deprecated (will be removed after 0.171.0) Import from `std/streams/delimiter_stream.ts` instead.
   *
   * Transform a stream into a stream where each chunk is divided by a given delimiter.
   *
   * ```ts
   * import { TextDelimiterStream } from "https://deno.land/std@$STD_VERSION/streams/delimiter.ts";
   * const res = await fetch("https://example.com");
   * const parts = res.body!
   *   .pipeThrough(new TextDecoderStream())
   *   .pipeThrough(new TextDelimiterStream("foo"));
   * ```
   */
  TextDelimiterStream,
} from "./text_delimiter_stream.ts";
