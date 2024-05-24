// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { createLPS } from "./_common.ts";

import type {
  DelimiterDisposition,
  DelimiterStreamOptions,
} from "./delimiter_stream.ts";

/**
 * Transform a stream `string` into a stream where each chunk is divided by a
 * given delimiter.
 *
 * @example JSON Lines
 * ```ts
 * const stream = ReadableStream.from([
 *   '{"name": "Alice", "age": ',
 *   '30}\n{"name": "Bob", "age"',
 *   ": 25}\n",
 * ]);
 *
 * // Split the stream by newline and parse each line as a JSON object
 * const jsonStream = stream.pipeThrough(new TextDelimiterStream("\n"))
 *   .pipeThrough(toTransformStream<string, unknown>(async function* (src) {
 *     for await (const chunk of src) {
 *       if (chunk.trim().length === 0) {
 *         continue;
 *       }
 *       yield JSON.parse(chunk);
 *     }
 *   }));
 *
 * assertEquals(
 *   await Array.fromAsync(jsonStream),
 *   [{ "name": "Alice", "age": 30 }, { "name": "Bob", "age": 25 }],
 * );
 * ```
 */
export class TextDelimiterStream extends TransformStream<string, string> {
  #buf = "";
  #delimiter: string;
  #inspectIndex = 0;
  #matchIndex = 0;
  #delimLPS: Uint8Array;
  #disp: DelimiterDisposition;

  /** Constructs a new instance. */
  constructor(delimiter: string, options?: DelimiterStreamOptions) {
    super({
      transform: (chunk, controller) => {
        this.#handle(chunk, controller);
      },
      flush: (controller) => {
        controller.enqueue(this.#buf);
      },
    });

    this.#delimiter = delimiter;
    this.#delimLPS = createLPS(new TextEncoder().encode(delimiter));
    this.#disp = options?.disposition ?? "discard";
  }

  #handle(
    chunk: string,
    controller: TransformStreamDefaultController<string>,
  ) {
    this.#buf += chunk;
    let localIndex = 0;
    while (this.#inspectIndex < this.#buf.length) {
      if (chunk[localIndex] === this.#delimiter[this.#matchIndex]) {
        this.#inspectIndex++;
        localIndex++;
        this.#matchIndex++;
        if (this.#matchIndex === this.#delimiter.length) {
          // Full match
          const start = this.#inspectIndex - this.#delimiter.length;
          const end = this.#disp === "suffix" ? this.#inspectIndex : start;
          const copy = this.#buf.slice(0, end);
          controller.enqueue(copy);
          const shift = this.#disp === "prefix" ? start : this.#inspectIndex;
          this.#buf = this.#buf.slice(shift);
          this.#inspectIndex = this.#disp === "prefix"
            ? this.#delimiter.length
            : 0;
          this.#matchIndex = 0;
        }
      } else {
        if (this.#matchIndex === 0) {
          this.#inspectIndex++;
          localIndex++;
        } else {
          this.#matchIndex = this.#delimLPS[this.#matchIndex - 1]!;
        }
      }
    }
  }
}
