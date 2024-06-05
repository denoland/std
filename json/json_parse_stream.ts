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
 * @example Basic usage
 *
 * ```ts
 * import { JsonParseStream } from "@std/json/json-parse-stream";
 * import { assertEquals } from "@std/assert/assert-equals";
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
 */
export class JsonParseStream extends TransformStream<string, JsonValue> {
  /**
   * Constructs new instance.
   *
   * @example Basic usage
   *
   * ```ts
   * import { JsonParseStream } from "@std/json/json-parse-stream";
   * import { assertEquals } from "@std/assert/assert-equals";
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
   */
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
