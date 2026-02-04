// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

type Sliceable = {
  slice(start?: number, end?: number): Sliceable;
  length: number;
};

export class RandomSliceStream<T extends Sliceable>
  extends TransformStream<T, T> {
  constructor() {
    super({
      transform(chunk, controller) {
        const i = Math.floor(Math.random() * chunk.length);
        controller.enqueue(chunk.slice(0, i) as T);
        controller.enqueue(chunk.slice(i) as T);
      },
    });
  }
}
