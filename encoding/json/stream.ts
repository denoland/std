// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

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

export * from "./_parse.ts";
export * from "./_stringify.ts";
