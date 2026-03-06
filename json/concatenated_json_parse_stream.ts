// Copyright 2018-2026 the Deno authors. MIT license.
import { toTransformStream } from "@std/streams/to-transform-stream";
import type { JsonValue } from "./types.ts";
import { parse } from "./_common.ts";

function isBlankChar(char: string | undefined) {
  return char !== undefined && [" ", "\t", "\r", "\n"].includes(char);
}

const primitives = new Map(
  (["null", "true", "false"] as const).map((v) => [v[0], v]),
);

/**
 * Stream to parse
 * {@link https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON | Concatenated JSON}.
 *
 * @example Usage
 *
 * ```ts
 * import { ConcatenatedJsonParseStream } from "@std/json/concatenated-json-parse-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   `{"foo":"bar"}`,
 *   `{"baz":100}`,
 * ]).pipeThrough(new ConcatenatedJsonParseStream());
 *
 * assertEquals(await Array.fromAsync(stream), [
 *   { foo: "bar" },
 *   { baz: 100 },
 * ]);
 * ```
 */
export class ConcatenatedJsonParseStream
  implements TransformStream<string, JsonValue> {
  /**
   * A writable stream of byte data.
   *
   * @example Usage
   * ```ts
   * import { ConcatenatedJsonParseStream } from "@std/json/concatenated-json-parse-stream";
   * import { assertEquals } from "@std/assert";
   *
   * const stream = ReadableStream.from([
   *   `{"foo":"bar"}`,
   *   `{"baz":100}`,
   * ]).pipeThrough(new ConcatenatedJsonParseStream());
   *
   * assertEquals(await Array.fromAsync(stream), [
   *   { foo: "bar" },
   *   { baz: 100 },
   * ]);
   * ```
   */
  readonly writable: WritableStream<string>;
  /**
   * A readable stream of byte data.
   *
   * @example Usage
   * ```ts
   * import { ConcatenatedJsonParseStream } from "@std/json/concatenated-json-parse-stream";
   * import { assertEquals } from "@std/assert";
   *
   * const stream = ReadableStream.from([
   *   `{"foo":"bar"}`,
   *   `{"baz":100}`,
   * ]).pipeThrough(new ConcatenatedJsonParseStream());
   *
   * assertEquals(await Array.fromAsync(stream), [
   *   { foo: "bar" },
   *   { baz: 100 },
   * ]);
   * ```
   */
  readonly readable: ReadableStream<JsonValue>;

  /**
   * Constructs a new instance.
   */
  constructor() {
    const { writable, readable } = toTransformStream(
      this.#concatenatedJSONIterator,
    );
    this.writable = writable;
    this.readable = readable;
  }

  async *#concatenatedJSONIterator(src: AsyncIterable<string>) {
    // Counts the number of '{', '}', '[', ']', and when the nesting level reaches 0, concatenates and returns the string.
    let targetString = "";
    let hasValue = false;
    let nestCount = 0;
    let readingString = false;
    let escapeNext = false;
    let readingPrimitive: false | "null" | "true" | "false" = false;
    let positionInPrimitive = 0;
    for await (const string of src) {
      let sliceStart = 0;
      for (let i = 0; i < string.length; i++) {
        const char = string[i];

        // We're reading a primitive at the top level
        if (readingPrimitive) {
          if (char === readingPrimitive[positionInPrimitive]) {
            positionInPrimitive++;

            // Emit the primitive when done reading
            if (positionInPrimitive === readingPrimitive.length) {
              yield parse(targetString + string.slice(sliceStart, i + 1));
              hasValue = false;
              readingPrimitive = false;
              positionInPrimitive = 0;
              targetString = "";
              sliceStart = i + 1;
            }
          } else {
            // If the primitive is malformed, keep reading, maybe the next characters can be useful in the syntax error.
            readingPrimitive = false;
            positionInPrimitive = 0;
          }
          continue;
        }

        if (readingString) {
          if (char === '"' && !escapeNext) {
            readingString = false;

            // When the nesting level is 0, it returns a string when '"' comes.
            if (nestCount === 0 && hasValue) {
              yield parse(targetString + string.slice(sliceStart, i + 1));
              hasValue = false;
              targetString = "";
              sliceStart = i + 1;
            }
          }
          escapeNext = !escapeNext && char === "\\";
          continue;
        }

        // Parses number with a nesting level of 0.
        // example: '0["foo"]' => 0, ["foo"]
        // example: '3.14{"foo": "bar"}' => 3.14, {foo: "bar"}
        if (
          hasValue && nestCount === 0 &&
          (char === "{" || char === "[" || char === '"' || char === " " ||
            char === "n" || char === "t" || char === "f")
        ) {
          yield parse(targetString + string.slice(sliceStart, i));
          hasValue = false;
          readingString = false;
          targetString = "";
          sliceStart = i;
          i--;
          continue;
        }

        switch (char) {
          case '"':
            readingString = true;
            escapeNext = false;
            break;
          case "{":
          case "[":
            nestCount++;
            break;
          case "}":
          case "]":
            nestCount--;
            break;
        }

        if (nestCount === 0 && primitives.has(char)) {
          // The first letter of a primitive at top level was found
          readingPrimitive = primitives.get(char)!;
          positionInPrimitive = 1;
        }

        // parse object or array
        if (
          hasValue && nestCount === 0 &&
          (char === "}" || char === "]")
        ) {
          yield parse(targetString + string.slice(sliceStart, i + 1));
          hasValue = false;
          targetString = "";
          sliceStart = i + 1;
          continue;
        }

        if (!hasValue && !isBlankChar(char)) {
          // We want to ignore the character string with only blank, so if there is a character other than blank, record it.
          hasValue = true;
        }
      }
      targetString += string.slice(sliceStart);
    }
    if (hasValue) {
      yield parse(targetString);
    }
  }
}
