// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Options for {@linkcode JsonStringifyStream}. */
export interface StringifyStreamOptions {
  /**
   * Prefix to be added after stringify.
   *
   * @default {""}
   */
  readonly prefix?: string;
  /**
   * Suffix to be added after stringify.
   *
   * @default {"\n"}
   */
  readonly suffix?: string;
}

/**
 * Convert each chunk to JSON string.
 *
 * This can be used to stringify {@link https://jsonlines.org/ | JSON lines},
 * {@link https://en.wikipedia.org/wiki/JSON_streaming#Newline-delimited_JSON | NDJSON},
 * {@link https://www.rfc-editor.org/rfc/rfc7464.html | JSON Text Sequences},
 * and {@link https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON | Concatenated JSON}.
 *
 * You can optionally specify a prefix and suffix for each chunk. The default prefix is `""` and the default suffix is `"\n"`.
 *
 * @example Basic usage
 *
 * ```ts
 * import { JsonStringifyStream } from "@std/json/stringify-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([{ foo: "bar" }, { baz: 100 }])
 *   .pipeThrough(new JsonStringifyStream());
 *
 * assertEquals(await Array.fromAsync(stream), [
 *   `{"foo":"bar"}\n`,
 *   `{"baz":100}\n`
 * ]);
 * ```
 *
 * @example Stringify stream of JSON text sequences
 *
 * Set `options.prefix` to `\x1E` to stringify
 * {@linkcode https://www.rfc-editor.org/rfc/rfc7464.html | JSON Text Sequences}.
 *
 * ```ts
 * import { JsonStringifyStream } from "@std/json/stringify-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([{ foo: "bar" }, { baz: 100 }])
 *   .pipeThrough(new JsonStringifyStream({ prefix: "\x1E", suffix: "\n" }));
 *
 * assertEquals(await Array.fromAsync(stream), [
 *   `\x1E{"foo":"bar"}\n`,
 *   `\x1E{"baz":100}\n`
 * ]);
 * ```
 *
 * @example Stringify JSON lines from a server
 *
 * ```ts ignore no-assert
 * import { JsonStringifyStream } from "@std/json/stringify-stream";
 *
 * // A server that streams one line of JSON every second
 * Deno.serve(() => {
 *   let intervalId: number | undefined;
 *   const readable = new ReadableStream({
 *     start(controller) {
 *       // Enqueue data once per second
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
 *     .pipeThrough(new JsonStringifyStream()) // Convert data to JSON lines
 *     .pipeThrough(new TextEncoderStream()); // Convert a string to a Uint8Array
 *
 *   return new Response(body);
 * });
 * ```
 */
export class JsonStringifyStream extends TransformStream<unknown, string> {
  /**
   * Constructs new instance.
   *
   * @param options Options for the stream.
   */
  constructor(options?: StringifyStreamOptions) {
    const { prefix = "", suffix = "\n" } = options ?? {};
    super(
      {
        transform(chunk, controller) {
          controller.enqueue(`${prefix}${JSON.stringify(chunk)}${suffix}`);
        },
      },
    );
  }
}
