// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { TextLineStream } from "./text_line_stream.ts";

/**
 * Converts a {@linkcode ReadableStream} of {@linkcode Uint8Array}s into one of
 * lines delimited by `\n` or `\r\n`. Trims the last line if empty.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param readable A stream of {@linkcode Uint8Array}s.
 * @param options Stream options.
 * @returns A stream of lines delimited by `\n` or `\r\n`.
 *
 * @example Usage
 * ```ts
 * import { toLines } from "@std/streams/unstable-to-lines";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const readable = ReadableStream.from([
 *   "qwertzu",
 *   "iopasd\r\nmnbvc",
 *   "xylk\rjhgfds\napoiuzt\r",
 *   "qwr\r09ei\rqwrjiowqr\r",
 * ]).pipeThrough(new TextEncoderStream());
 *
 * assertEquals(await Array.fromAsync(toLines(readable)), [
 *   "qwertzuiopasd",
 *   "mnbvcxylk\rjhgfds",
 *   "apoiuzt\rqwr\r09ei\rqwrjiowqr\r",
 * ]);
 * ```
 */
export function toLines(
  readable: ReadableStream<Uint8Array>,
  options?: StreamPipeOptions,
): ReadableStream<string> {
  return readable
    .pipeThrough(new TextDecoderStream() as TransformStream<Uint8Array, string>)
    .pipeThrough(new TextLineStream(), options);
}
