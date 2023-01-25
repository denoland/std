// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { toTransformStream } from "../../streams/to_transform_stream.ts";

/** The type of the result of parsing JSON. */
export type JsonValue =
  | { [key: string]: JsonValue | undefined }
  | JsonValue[]
  | string
  | number
  | boolean
  | null;

/** Optional object interface for `JSONParseStream` and `ConcatenatedJsonParseStream`. */
export interface ParseStreamOptions {
  /** Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream. */
  readonly writableStrategy?: QueuingStrategy<string>;
  /** Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream. */
  readonly readableStrategy?: QueuingStrategy<JsonValue>;
}

/**
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
export class JsonParseStream extends TransformStream<string, JsonValue> {
  /**
   * @param options
   * @param options.writableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   * @param options.readableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
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

const branks = /^[ \t\r\n]*$/;
function isBrankString(str: string) {
  return branks.test(str);
}

/**
 * stream to parse [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON).
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

const blank = new Set(" \t\r\n");
function isBrankChar(char: string) {
  return blank.has(char);
}

/** JSON.parse with detailed error message. */
function parse(text: string): JsonValue {
  try {
    return JSON.parse(text);
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Truncate the string so that it is within 30 lengths.
      const truncatedText = 30 < text.length ? `${text.slice(0, 30)}...` : text;
      throw new (error.constructor as ErrorConstructor)(
        `${error.message} (parsing: '${truncatedText}')`,
      );
    }
    throw error;
  }
}
