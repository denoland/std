// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A transform stream that accepts a {@linkcode AbortSignal} to easily abort a
 * stream pipeThrough.
 *
 * @deprecated Use [`readable.pipThrough`'s signal option](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/pipeThrough#signal) instead.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeparam T The type of the chunks passing through the AbortStream.
 *
 * @example Usage
 * ```ts
 * import { AbortStream } from "@std/streams/unstable-abort-stream";
 * import { assertRejects } from "@std/assert/rejects";
 *
 * const controller = new AbortController();
 * controller.abort(new Error("STOP"));
 *
 * await assertRejects(
 *   async function () {
 *     await new Response(
 *       (await Deno.open("./deno.json"))
 *         .readable
 *         .pipeThrough(new AbortStream(controller.signal)),
 *     )
 *       .bytes();
 *   },
 *   Error,
 *   "STOP",
 * );
 * ```
 */
export class AbortStream<T> extends TransformStream<T, T> {
  /**
   * Constructs a new instance.
   *
   * @param signal The {@linkcode AbortSignal}.
   */
  constructor(signal: AbortSignal) {
    super({
      transform(chunk, controller) {
        if (signal.aborted) controller.error(signal.reason);
        else controller.enqueue(chunk);
      },
    });
  }
}
