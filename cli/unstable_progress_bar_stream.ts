// Copyright 2018-2025 the Deno authors. MIT license.

import {
  createProgressBar,
  type ProgressBarOptions,
} from "./unstable_progress_bar.ts";

export class ProgressBarStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(
    writable: WritableStream<Uint8Array>,
    options: ProgressBarOptions,
  ) {
    const addProgress = createProgressBar(writable, options);
    super({
      async transform(chunk, controller) {
        await addProgress(chunk.length);
        controller.enqueue(chunk);
      },
      async flush(_controller) {
        await addProgress(0, true);
      },
      async cancel() {
        await addProgress(0, true);
      },
    });
  }
}
