// Copyright 2018-2026 the Deno authors. MIT license.

import {
  ProgressBar,
  type ProgressBarOptions,
} from "./unstable_progress_bar.ts";

import type { Uint8Array_ } from "./_types.ts";

export type { Uint8Array_ };

/**
 * `ProgressBarStream` is a {@link TransformStream} class that reports updates
 * to a separate {@link WritableStream} on a 1s interval.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic Usage
 * ```ts ignore no-assert
 * import { ProgressBarStream } from "@std/cli/unstable-progress-bar-stream";
 *
 * const response = await fetch("https://example.com/");
 * const max = Number(response.headers.get("content-length"));
 * let readable = response.body
 * if (max) {
 *   readable = readable
 *     ?.pipeThrough(new ProgressBarStream({ max })) ?? null;
 * }
 * await readable?.pipeTo((await Deno.create("./_tmp/example.com.html")).writable);
 * ```
 */
export class ProgressBarStream
  extends TransformStream<Uint8Array_, Uint8Array_> {
  /**
   * Constructs a new instance.
   *
   * @example Basic Usage
   * ```ts ignore no-assert
   * import { ProgressBarStream } from "@std/cli/unstable-progress-bar-stream";
   *
   * const response = await fetch("https://example.com/");
   * const max = Number(response.headers.get("content-length"));
   * let readable = response.body
   * if (max) {
   *   readable = readable
   *     ?.pipeThrough(new ProgressBarStream({ max })) ?? null;
   * }
   * await readable?.pipeTo((await Deno.create("./_tmp/example.com.html")).writable);
   * ```
   * @param options The options to configure various settings of the progress bar.
   */
  constructor(
    options: ProgressBarOptions,
  ) {
    let bar: ProgressBar | undefined;
    super({
      start(_controller) {
        bar = new ProgressBar(options);
      },
      transform(chunk, controller) {
        if (bar) bar.value += chunk.length;
        controller.enqueue(chunk);
      },
      flush(_controller) {
        bar?.stop();
      },
      cancel() {
        bar?.stop();
      },
    });
  }
}
