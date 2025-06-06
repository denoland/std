// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A transform stream that accepts an optional {@linkcode AbortSignal} to easily
 * abort a stream pipeThrough.
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
   * @param signal The optional {@linkcode AbortSignal}.
   */
  constructor(signal?: AbortSignal) {
    super(
      signal
        ? {
          transform(chunk, controller) {
            if (signal.aborted) controller.error(signal.reason);
            else controller.enqueue(chunk);
          },
        }
        : {},
    );
  }
}
