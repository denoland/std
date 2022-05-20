// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { TextDelimiterStream } from "../../streams/delimiter.ts";
import { toTransformStream } from "../../streams/conversion.ts";

export type JSONValue =
  | { [key: string]: JSONValue }
  | JSONValue[]
  | string
  | number
  | boolean;

export interface ParseStreamOptions {
  /**a character to separate JSON. The default is '\n'. */
  readonly separator?: string;
  /** Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream. */
  readonly writableStrategy?: QueuingStrategy<string>;
  /** Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream. */
  readonly readableStrategy?: QueuingStrategy<JSONValue>;
}

/**
 * stream to parse [JSON lines](https://jsonlines.org/), [NDJSON](http://ndjson.org/) and [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464).
 *
 * ```ts
 * import { JSONLinesParseStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";
 *
 * const url = "https://deno.land/std@$STD_VERSION/encoding/testdata/json/test.jsonl";
 * const { body } = await fetch(url);
 *
 * const readable = body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new JSONLinesParseStream());
 *
 * for await (const data of readable) {
 *   console.log(data);
 * }
 * ```
 */
export class JSONLinesParseStream
  implements TransformStream<string, JSONValue> {
  readonly writable: WritableStream<string>;
  readonly readable: ReadableStream<JSONValue>;
  /**
   * @param options
   * @param options.separator a character to separate JSON. The default is '\n'.
   * @param options.writableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   * @param options.readableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   */
  constructor({
    separator = "\n",
    writableStrategy,
    readableStrategy,
  }: ParseStreamOptions = {}) {
    const { writable, readable } = new TextDelimiterStream(separator);
    this.writable = writable;
    this.readable = readable.pipeThrough(
      new TransformStream(
        {
          transform(
            chunk: string,
            controller: TransformStreamDefaultController<JSONValue>,
          ) {
            if (!isBrankString(chunk)) {
              controller.enqueue(parse(chunk));
            }
          },
        },
        writableStrategy,
        readableStrategy,
      ),
    );
  }
}

/**
 * stream to parse [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON).
 *
 * ```ts
 * import { ConcatenatedJSONParseStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";
 *
 * const url = "https://deno.land/std@$STD_VERSION/encoding/testdata/json/test.concatenated-json";
 * const { body } = await fetch(url);
 *
 * const readable = body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new ConcatenatedJSONParseStream());
 *
 * for await (const data of readable) {
 *   console.log(data);
 * }
 * ```
 */
export class ConcatenatedJSONParseStream
  implements TransformStream<string, JSONValue> {
  readonly writable: WritableStream<string>;
  readonly readable: ReadableStream<JSONValue>;
  /**
   * @param options
   * @param options.separator This parameter will be ignored.
   * @param options.writableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   * @param options.readableStrategy Controls the buffer of the TransformStream used internally. Check https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream.
   */
  constructor(options: ParseStreamOptions = {}) {
    const { writable, readable } = toTransformStream(
      this.#concatenatedJSONIterator,
      options.writableStrategy,
      options.readableStrategy,
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

/** JSON.parse with detailed error message */
function parse(text: string): JSONValue {
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

const blank = new Set(" \t\r\n");
function isBrankChar(char: string) {
  return blank.has(char);
}

const branks = /[^ \t\r\n]/;
function isBrankString(str: string) {
  return !branks.test(str);
}
