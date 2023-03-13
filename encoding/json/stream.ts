// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is not browser compatible.

/***
 * Streams JSON concatenated with line breaks or special characters. This module
 * supports the following formats:
 * - [JSON lines](https://jsonlines.org/)
 * - [NDJSON](http://ndjson.org/)
 * - [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464)
 * - [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON)
 * - JSON concatenated with any delimiter
 *
 * If you want to parse JSON separated by a delimiter, use {@linkcode TextLineStream}
 * (or {@linkcode TextDelimiterStream}) and {@linkcode JsonParseStream}.
 * {@linkcode JsonParseStream} ignores chunks consisting of spaces, tab
 * characters, or newline characters.
 *
 * If you want to parse
 * [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON),
 * use {@linkcode ConcatenatedJsonParseStream}.
 *
 * Use {@linkcode JsonStringifyStream} to transform streaming data to
 * [JSON lines](https://jsonlines.org/), [NDJSON](http://ndjson.org/),
 * [NDJSON](http://ndjson.org/) or
 * [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON).
 */

export {
  /**
   * @deprecated (will be removed after 0.182.0) Import from `json/concatenated_json_parse_stream.ts` instead.
   *
   * Stream to parse [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON).
   *
   * @example
   * ```ts
   * import { ConcatenatedJsonParseStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";
   *
   * const url = "https://deno.land/std@$STD_VERSION/encoding/testdata/json/test.concatenated-json";
   * const { body } = await fetch(url);
   *
   * const readable = body!
   *   .pipeThrough(new TextDecoderStream()) // convert Uint8Array to string
   *   .pipeThrough(new ConcatenatedJsonParseStream()); // parse Concatenated JSON
   *
   * for await (const data of readable) {
   *   console.log(data);
   * }
   * ```
   */
  ConcatenatedJsonParseStream,
  /**
   * @deprecated (will be removed after 0.182.0) Import from `json/json_parse_stream.ts` instead.
   *
   * Parse each chunk as JSON.
   *
   * This can be used to parse [JSON lines](https://jsonlines.org/), [NDJSON](http://ndjson.org/) and [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464).
   * Chunks consisting of spaces, tab characters, or newline characters will be ignored.
   *
   * @example
   * parse JSON lines or NDJSON
   * ```ts
   * import { TextLineStream } from "https://deno.land/std@$STD_VERSION/streams/text_line_stream.ts";
   * import { JsonParseStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";
   *
   * const url = "https://deno.land/std@$STD_VERSION/encoding/testdata/json/test.jsonl";
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
   * import { TextDelimiterStream } from "https://deno.land/std@$STD_VERSION/streams/text_delimiter_stream.ts";
   * import { JsonParseStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";
   *
   * const url =
   *   "https://deno.land/std@$STD_VERSION/encoding/testdata/json/test.json-seq";
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
  JsonParseStream,
  /**
   * @deprecated (will be removed after 0.182.0) Import from `json/json_stringify_stream.ts` instead.
   *
   * Convert each chunk to JSON string.
   *
   * This can be used to stringify [JSON lines](https://jsonlines.org/), [NDJSON](http://ndjson.org/), [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464), and [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON).
   * You can optionally specify a prefix and suffix for each chunk. The default prefix is "" and the default suffix is "\n".
   *
   * @example
   * ```ts
   * import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/readable_stream_from_iterable.ts";
   * import { JsonStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";
   *
   * const file = await Deno.open("./tmp.jsonl", { create: true, write: true });
   *
   * readableStreamFromIterable([{ foo: "bar" }, { baz: 100 }])
   *   .pipeThrough(new JsonStringifyStream()) // convert to JSON lines (ndjson)
   *   .pipeThrough(new TextEncoderStream()) // convert a string to a Uint8Array
   *   .pipeTo(file.writable)
   *   .then(() => console.log("write success"));
   * ```
   *
   * @example
   * To convert to [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464), set the
   * prefix to the delimiter "\x1E" as options.
   * ```ts
   * import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/readable_stream_from_iterable.ts";
   * import { JsonStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";
   *
   * const file = await Deno.open("./tmp.jsonl", { create: true, write: true });
   *
   * readableStreamFromIterable([{ foo: "bar" }, { baz: 100 }])
   *   .pipeThrough(new JsonStringifyStream({ prefix: "\x1E", suffix: "\n" })) // convert to JSON Text Sequences
   *   .pipeThrough(new TextEncoderStream())
   *   .pipeTo(file.writable)
   *   .then(() => console.log("write success"));
   * ```
   *
   * @example
   * If you want to stream [JSON lines](https://jsonlines.org/) from the server:
   * ```ts
   * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   * import { JsonStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";
   *
   * // A server that streams one line of JSON every second
   * serve(() => {
   *   let intervalId: number | undefined;
   *   const readable = new ReadableStream({
   *     start(controller) {
   *       // enqueue data once per second
   *       intervalId = setInterval(() => {
   *         controller.enqueue({ now: new Date() });
   *       }, 1000);
   *     },
   *     cancel() {
   *       clearInterval(intervalId);
   *     },
   *   });
   *
   *   const body = readable
   *     .pipeThrough(new JsonStringifyStream()) // convert data to JSON lines
   *     .pipeThrough(new TextEncoderStream()); // convert a string to a Uint8Array
   *
   *   return new Response(body);
   * });
   * ```
   */
  JsonStringifyStream,
  /**
   * @deprecated (will be removed after 0.182.0) Import from `json/common.ts` instead.
   *
   * The type of the result of parsing JSON.
   */
  type JsonValue,
  /**
   * @deprecated (will be removed after 0.182.0) Import from `json/common.ts` instead.
   *
   * Optional object interface for `JSONParseStream` and `ConcatenatedJsonParseStream`.
   */
  type ParseStreamOptions,
  /**
   * @deprecated (will be removed after 0.182.0) Import from `json/json_stringify_stream.ts` instead.
   *
   * Optional object interface for `JsonStringifyStream`.
   */
  type StringifyStreamOptions,
} from "../../json/mod.ts";
