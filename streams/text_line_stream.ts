// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Options for {@linkcode TextLineStream}. */
export interface TextLineStreamOptions {
  /**
   * Allow splitting by `\r`.
   *
   * @default {false}
   */
  allowCR?: boolean;
}

/**
 * Transform a stream into a stream where each chunk is divided by a newline,
 * be it `\n` or `\r\n`. `\r` can be enabled via the `allowCR` option.
 *
 * If you want to split by a custom delimiter, consider using {@linkcode TextDelimiterStream}.
 *
 * @example JSON Lines
 * ```ts
 * import { TextLineStream } from "@std/streams/text-line-stream";
 * import { toTransformStream } from "@std/streams/to-transform-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   '{"name": "Alice", "age": ',
 *   '30}\n{"name": "Bob", "age"',
 *   ": 25}\n",
 * ]);
 *
 * type Person = { name: string; age: number };
 *
 * // Split the stream by newline and parse each line as a JSON object
 * const jsonStream = stream.pipeThrough(new TextLineStream())
 *   .pipeThrough(toTransformStream(async function* (src) {
 *     for await (const chunk of src) {
 *       if (chunk.trim().length === 0) {
 *         continue;
 *       }
 *       yield JSON.parse(chunk) as Person;
 *     }
 *   }));
 *
 * assertEquals(
 *   await Array.fromAsync(jsonStream),
 *   [{ "name": "Alice", "age": 30 }, { "name": "Bob", "age": 25 }],
 * );
 * ```
 *
 * @example Allow splitting by `\r`
 *
 * ```ts
 * import { TextLineStream } from "@std/streams/text-line-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *  "CR\rLF",
 *  "\nCRLF\r\ndone",
 * ]).pipeThrough(new TextLineStream({ allowCR: true }));
 *
 * const lines = await Array.fromAsync(stream);
 *
 * assertEquals(lines, ["CR", "LF", "CRLF", "done"]);
 * ```
 */
export class TextLineStream extends TransformStream<string, string> {
  #pending: string[] = [];
  #pendingTrailsCR = false;

  /**
   * Constructs a new instance.
   *
   * @param options Options for the stream.
   */
  constructor(options: TextLineStreamOptions = { allowCR: false }) {
    const allowCR = options.allowCR ?? false;
    super({
      transform: (chars, controller) => {
        if (chars.length === 0) return;

        // Fast path: if no line can complete within this chunk, buffer it
        // without rescanning the accumulated text. This keeps the total cost
        // linear when a single line spans many chunks. (With `allowCR`, a
        // buffered chunk-final "\r" resolves as soon as the next chunk
        // arrives, so it forces processing.)
        if (
          !chars.includes("\n") &&
          (!allowCR || (!this.#pendingTrailsCR && !chars.includes("\r")))
        ) {
          this.#pending.push(chars);
          return;
        }

        this.#pending.push(chars);
        const text = this.#pending.length === 1
          ? this.#pending[0]!
          : this.#pending.join("");
        this.#pending.length = 0;

        let start = 0;
        let lfIndex = text.indexOf("\n");
        let crIndex = allowCR ? text.indexOf("\r") : -1;

        while (true) {
          if (
            crIndex !== -1 && crIndex !== (text.length - 1) &&
            (lfIndex === -1 || (lfIndex - 1) > crIndex)
          ) {
            controller.enqueue(text.slice(start, crIndex));
            start = crIndex + 1;
            crIndex = text.indexOf("\r", start);
            continue;
          }

          if (lfIndex === -1) break;

          const endIndex = text[lfIndex - 1] === "\r" ? lfIndex - 1 : lfIndex;
          controller.enqueue(text.slice(start, endIndex));
          start = lfIndex + 1;
          lfIndex = text.indexOf("\n", start);
          if (crIndex !== -1 && crIndex < start) {
            crIndex = text.indexOf("\r", start);
          }
        }

        if (start < text.length) {
          const leftover = start === 0 ? text : text.slice(start);
          this.#pending.push(leftover);
          this.#pendingTrailsCR = allowCR && leftover.endsWith("\r");
        } else {
          this.#pendingTrailsCR = false;
        }
      },
      flush: (controller) => {
        if (this.#pending.length === 0) return;
        let currentLine = this.#pending.length === 1
          ? this.#pending[0]!
          : this.#pending.join("");
        if (allowCR && currentLine.endsWith("\r")) {
          currentLine = currentLine.slice(0, -1);
        }
        controller.enqueue(currentLine);
      },
    });
  }
}
