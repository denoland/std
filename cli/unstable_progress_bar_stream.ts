// Copyright 2018-2025 the Deno authors. MIT license.

import {
  ProgressBar,
  type ProgressBarOptions,
} from "./unstable_progress_bar.ts";

/**
 * `ProgressBarStream` is a {@link TransformStream} class that reports updates
 * to a separate {@link WritableStream} on a 1s interval.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic Usage
 * ```ts no-assert
 * import { ProgressBarStream } from "@std/cli/unstable-progress-bar-stream";
 *
 * const response = await fetch("https://example.com/");
 * const max = Number(response.headers.get("content-length"));
 * let readable = response.body
 * if (max) {
 *   readable = readable
 *     ?.pipeThrough(new ProgressBarStream(Deno.stdout.writable, { max })) ?? null;
 * }
 * await readable?.pipeTo((await Deno.create("./_tmp/example.com.html")).writable);
 * ```
 */
export class ProgressBarStream extends TransformStream<Uint8Array, Uint8Array> {
  /**
   * Constructs a new instance.
   *
   * @example Basic Usage
   * ```ts no-assert
   * import { ProgressBarStream } from "@std/cli/unstable-progress-bar-stream";
   *
   * const response = await fetch("https://example.com/");
   * const max = Number(response.headers.get("content-length"));
   * let readable = response.body
   * if (max) {
   *   readable = readable
   *     ?.pipeThrough(new ProgressBarStream(Deno.stdout.writable, { max })) ?? null;
   * }
   * await readable?.pipeTo((await Deno.create("./_tmp/example.com.html")).writable);
   * ```
   *
   * @param writable The {@link WritableStream} that will receive the progress bar
   * reports.
   * @param options The options to configure various settings of the progress bar.
   */
  constructor(
    writable: WritableStream<Uint8Array>,
    options: ProgressBarOptions,
  ) {
    let bar: ProgressBar | undefined;
    super({
      start(_controller) {
        bar = new ProgressBar(writable, options);
        bar.start();
      },
      transform(chunk, controller) {
        bar?.add(chunk.length);
        controller.enqueue(chunk);
      },
      flush(_controller) {
        bar?.end();
      },
      cancel() {
        bar?.end();
      },
    });
  }
}
