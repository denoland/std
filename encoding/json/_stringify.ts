// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export interface StringifyStreamOptions {
  /**a character to separate JSON. The default is '\n'. */
  readonly separator?: string;
  /** Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream. */
  readonly writableStrategy?: QueuingStrategy<unknown>;
  /** Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream. */
  readonly readableStrategy?: QueuingStrategy<string>;
}

/**
 * stream to stringify [JSON lines](https://jsonlines.org/), [NDJSON](http://ndjson.org/) and [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464).
 *
 * ```ts
 * import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
 * import { JSONLinesStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";
 *
 * const file = await Deno.open(new URL("./tmp.jsonl", import.meta.url), {
 *   create: true,
 *   write: true,
 * });
 *
 * readableStreamFromIterable([{ foo: "bar" }, { baz: 100 }])
 *   .pipeThrough(new JSONLinesStringifyStream())
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeTo(file.writable)
 *   .then(() => console.log("write success"));
 * ```
 */
export class JSONLinesStringifyStream extends TransformStream<unknown, string> {
  /**
   * @param options
   * @param options.separator a character to separate JSON. The default is '\n'.
   * @param options.writableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   * @param options.readableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   */
  constructor(options: StringifyStreamOptions = {}) {
    const { separator = "\n", writableStrategy, readableStrategy } = options;
    const [prefix, suffix] = separator.includes("\n")
      ? ["", separator]
      : [separator, "\n"];
    super(
      {
        transform(chunk, controller) {
          controller.enqueue(`${prefix}${JSON.stringify(chunk)}${suffix}`);
        },
      },
      writableStrategy,
      readableStrategy,
    );
  }
}

/**
 * stream to stringify [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON).
 *
 * ```ts
 * import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
 * import { ConcatenatedJSONStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";
 *
 * const file = await Deno.open(new URL("./tmp.concat-json", import.meta.url), {
 *   create: true,
 *   write: true,
 * });
 *
 * readableStreamFromIterable([{ foo: "bar" }, { baz: 100 }])
 *   .pipeThrough(new ConcatenatedJSONStringifyStream())
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeTo(file.writable)
 *   .then(() => console.log("write success"));
 * ```
 */
export class ConcatenatedJSONStringifyStream extends JSONLinesStringifyStream {
  /**
   * @param options
   * @param options.separator This parameter will be ignored.
   * @param options.writableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   * @param options.readableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   */
  constructor(options: StringifyStreamOptions = {}) {
    const { writableStrategy, readableStrategy } = options;
    super({ separator: "\n", writableStrategy, readableStrategy });
  }
}
