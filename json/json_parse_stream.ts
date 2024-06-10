// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { JsonValue, ParseStreamOptions } from "./common.ts";
import { parse } from "./_common.ts";

const branks = /^[ \t\r\n]*$/;
function isBrankString(str: string) {
  return branks.test(str);
}

/**
 * Parse each chunk as JSON.
 *
 * This can be used to parse {@link https://jsonlines.org/ | JSON lines},
 * {@link http://ndjson.org/ | NDJSON} and
 * {@link https://www.rfc-editor.org/rfc/rfc7464.html | JSON Text Sequences}.
 * Chunks consisting of spaces, tab characters, or newline characters will be ignored.
 *
 * @example
 * parse JSON lines or NDJSON
 * ```ts
 * import { TextLineStream } from "@std/streams/text-line-stream";
 * import { JsonParseStream } from "@std/json/json-parse-stream";
 *
 * const url = "@std/json/testdata/test.jsonl";
 * const { body } = await fetch(url);
 *
 * const readable = body!
 *   .pipeThrough(new TextDecoderStream())  // convert Uint8Array to string
 *   .pipeThrough(new TextLineStream()) // transform into a stream where each chunk is divided by a newline
 *   .pipeThrough(new JsonParseStream()); // parse each chunk as JSON
 *
 * for await (const data of readable) {
 *   console.log(data);
 * }
 * ```
 *
 * @example
 * parse JSON Text Sequences
 * ```ts
 * import { TextDelimiterStream } from "@std/streams/text-delimiter-stream";
 * import { JsonParseStream } from "@std/json/json-parse-stream";
 *
 * const url =
 *   "@std/json/testdata/test.json-seq";
 * const { body } = await fetch(url);
 *
 * const delimiter = "\x1E";
 * const readable = body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new TextDelimiterStream(delimiter)) // transform into a stream where each chunk is divided by a delimiter
 *   .pipeThrough(new JsonParseStream());
 *
 * for await (const data of readable) {
 *   console.log(data);
 * }
 * ```
 */
export class JsonParseStream extends TransformStream<string, JsonValue> {
  /** Constructs new instance. */
  constructor({ writableStrategy, readableStrategy }: ParseStreamOptions = {}) {
    super(
      {
        transform(chunk, controller) {
          if (!isBrankString(chunk)) {
            controller.enqueue(parse(chunk));
          }
        },
      },
      writableStrategy,
      readableStrategy,
    );
  }
}
