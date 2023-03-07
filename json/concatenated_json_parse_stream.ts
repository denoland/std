// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { toTransformStream } from "../streams/to_transform_stream.ts";
import type { JsonValue, ParseStreamOptions } from "./common.ts";
import { parse } from "./_common.ts";

const blank = new Set(" \t\r\n");
function isBrankChar(char: string) {
  return blank.has(char);
}

/**
 * Stream to parse [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON).
 *
 * @example
 * ```ts
 * import { ConcatenatedJsonParseStream } from "https://deno.land/std@$STD_VERSION/json/concatenated_json_parse_stream.ts";
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
export class ConcatenatedJsonParseStream
  implements TransformStream<string, JsonValue> {
  readonly writable: WritableStream<string>;
  readonly readable: ReadableStream<JsonValue>;
  /**
   * @param options
   * @param options.writableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   * @param options.readableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   */
  constructor({ writableStrategy, readableStrategy }: ParseStreamOptions = {}) {
    const { writable, readable } = toTransformStream(
      this.#concatenatedJSONIterator,
      writableStrategy,
      readableStrategy,
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
    for await (const string of src) {
      let sliceStart = 0;
      for (let i = 0; i < string.length; i++) {
        const char = string[i];

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

        // Parses number, true, false, null with a nesting level of 0.
        // example: 'null["foo"]' => null, ["foo"]
        // example: 'false{"foo": "bar"}' => false, {foo: "bar"}
        if (
          hasValue && nestCount === 0 &&
          (char === "{" || char === "[" || char === '"' || char === " ")
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

        if (!hasValue && !isBrankChar(char)) {
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
