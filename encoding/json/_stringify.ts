// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

/** Optional object interface for `JsonStringifyStream`. */
export interface StringifyStreamOptions {
  /** Prefix to be added after stringify. The default is "". */
  readonly prefix?: string;
  /** Suffix to be added after stringify. The default is "\n". */
  readonly suffix?: string;
  /** Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream. */
  readonly writableStrategy?: QueuingStrategy<unknown>;
  /** Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream. */
  readonly readableStrategy?: QueuingStrategy<string>;
}

/**
 * Convert each chunk to JSON string.
 *
 * This can be used to stringify [JSON lines](https://jsonlines.org/), [NDJSON](http://ndjson.org/), [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464), and [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON).
 * You can optionally specify a prefix and suffix for each chunk. The default prefix is "" and the default suffix is "\n".
 *
 * ```ts
 * import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
 * import { JsonStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";
 *
 * const file = await Deno.open("./tmp.jsonl", { create: true, write: true });
 *
 * readableStreamFromIterable([{ foo: "bar" }, { baz: 100 }])
 *   .pipeThrough(new JsonStringifyStream())
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeTo(file.writable)
 *   .then(() => console.log("write success"));
 * ```
 */
export class JsonStringifyStream extends TransformStream<unknown, string> {
  /**
   * @param options
   * @param options.prefix Prefix to be added after stringify. The default is "".
   * @param options.suffix Suffix to be added after stringify. The default is "\n".
   * @param options.writableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   * @param options.readableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   */
  constructor({
    prefix = "",
    suffix = "\n",
    writableStrategy,
    readableStrategy,
  }: StringifyStreamOptions = {}) {
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
