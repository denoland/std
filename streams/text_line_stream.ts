// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export interface TextLineStreamOptions {
  /**
   * Allow splitting by `\r`.
   *
   * @default {false}
   */
  allowCR: boolean;
}

/**
 * Transform a stream into a stream where each chunk is divided by a newline,
 * be it `\n` or `\r\n`.
 *
 * @example
 * ```ts
 * import { TextLineStream } from "https://deno.land/std@$STD_VERSION/streams/text_line_stream.ts";
 * const res = await fetch("https://example.com");
 * const lines = res.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new TextLineStream());
 * ```
 */
export class TextLineStream extends TransformStream<string, string> {
  #currentLine = "";

  constructor(options?: TextLineStreamOptions) {
    super({
      transform: (chars, controller) => {
        chars = this.#currentLine + chars;

        while (true) {
          const lfIndex = chars.indexOf("\n");

          if (options?.allowCR) {
            const crIndex = chars.indexOf("\r");

            if (
              crIndex !== -1 && crIndex !== (chars.length - 1) &&
              (lfIndex === -1 || (lfIndex - 1) > crIndex)
            ) {
              controller.enqueue(chars.slice(0, crIndex));
              chars = chars.slice(crIndex + 1);
              continue;
            }
          }

          if (lfIndex === -1) break;

          let crOrLfIndex = lfIndex;
          if (chars[lfIndex - 1] === "\r") {
            crOrLfIndex--;
          }
          controller.enqueue(chars.slice(0, crOrLfIndex));
          chars = chars.slice(lfIndex + 1);
        }

        this.#currentLine = chars;
      },
      flush: (controller) => {
        if (this.#currentLine === "") return;
        const currentLine =
          options?.allowCR && this.#currentLine.at(-1) === "\r"
            ? this.#currentLine.slice(0, -1)
            : this.#currentLine;
        controller.enqueue(currentLine);
      },
    });
  }
}
