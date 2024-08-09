// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { TextLineStream } from "./text_line_stream.ts";

/**
 * Converts a {@linkcode ReadableStream} of {@linkcode Uint8Array}s into one of
 * lines delimited by `\n` or `\r\n`. Trims the last line if empty.
 *
 * @param readable A stream of {@linkcode Uint8Array}s.
 * @param options Stream options.
 * @returns A stream of lines delimited by `\n`.
 *
 * @example Usage
 * ```ts
 * import { toLines } from "@std/streams/to-lines";
 * import { assertEquals } from "@std/assert/assert-equals";
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
 *   "apoiuzt\rqwr\r09ei\rqwrjiowqr",
 * ]);
 * ```
 *
 * @experimental
 */
export function toLines(
  readable: ReadableStream<Uint8Array>,
  options?: StreamPipeOptions,
): ReadableStream<string> {
  return readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream(), options);
}
