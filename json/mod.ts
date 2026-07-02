// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Utilities for parsing streaming JSON data (newline-delimited
 * JSON Lines / NDJSON, or concatenated JSON). Each chunk must
 * be a complete JSON value. Not suited for streaming elements
 * within a single large array.
 *
 * ```ts
 * import { JsonStringifyStream } from "@std/json";
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
 * @module
 */

export * from "./concatenated_json_parse_stream.ts";
export * from "./types.ts";
export * from "./parse_stream.ts";
export * from "./stringify_stream.ts";
export * from "./canonicalize.ts";
