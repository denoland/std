// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { JsonValue } from "./types.ts";
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
 * @example Basic usage
 *
 * ```ts
 * import { JsonParseStream } from "@std/json/parse-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   `{"foo":"bar"}\n`,
 *   `{"baz":100}\n`
 * ]).pipeThrough(new JsonParseStream());
 *
 * assertEquals(await Array.fromAsync(stream), [
 *   { foo: "bar" },
 *   { baz: 100 }
 * ]);
 * ```
 *
 * @example parse JSON lines or NDJSON from a file
 * ```ts
 * import { TextLineStream } from "@std/streams/text-line-stream";
 * import { JsonParseStream } from "@std/json/parse-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const file = await Deno.open("json/testdata/test.jsonl");
 *
 * const readable = file.readable
 *   .pipeThrough(new TextDecoderStream())  // convert Uint8Array to string
 *   .pipeThrough(new TextLineStream()) // transform into a stream where each chunk is divided by a newline
 *   .pipeThrough(new JsonParseStream()); // parse each chunk as JSON
 *
 * assertEquals(await Array.fromAsync(readable), [
 *  {"hello": "world"},
 *  ["👋", "👋", "👋"],
 *  {"deno": "🦕"},
 * ]);
 * ```
 */
export class JsonParseStream extends TransformStream<string, JsonValue> {
  /**
   * Constructs new instance.
   *
   * @example Basic usage
   *
   * ```ts
   * import { JsonParseStream } from "@std/json/parse-stream";
   * import { assertEquals } from "@std/assert";
   *
   * const stream = ReadableStream.from([
   *   `{"foo":"bar"}`,
   *   `{"baz":100}`,
   * ]).pipeThrough(new JsonParseStream());
   *
   * assertEquals(await Array.fromAsync(stream), [
   *   { foo: "bar" },
   *   { baz: 100 },
   * ]);
   * ```
   *
   * @example parse JSON lines or NDJSON from a file
   * ```ts
   * import { TextLineStream } from "@std/streams/text-line-stream";
   * import { JsonParseStream } from "@std/json/parse-stream";
   * import { assertEquals } from "@std/assert";
   *
   * const file = await Deno.open("json/testdata/test.jsonl");
   *
   * const readable = file.readable
   *   .pipeThrough(new TextDecoderStream())  // convert Uint8Array to string
   *   .pipeThrough(new TextLineStream()) // transform into a stream where each chunk is divided by a newline
   *   .pipeThrough(new JsonParseStream()); // parse each chunk as JSON
   *
   * assertEquals(await Array.fromAsync(readable), [
   *  {"hello": "world"},
   *  ["👋", "👋", "👋"],
   *  {"deno": "🦕"},
   * ]);
   * ```
   */
  constructor() {
    super(
      {
        transform(chunk, controller) {
          if (!isBrankString(chunk)) {
            controller.enqueue(parse(chunk));
          }
        },
      },
    );
  }
}
