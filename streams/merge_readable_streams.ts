// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { deferred } from "../async/deferred.ts";

/**
 * Merge multiple streams into a single one, not taking order into account.
 * If a stream ends before other ones, the other will continue adding data,
 * and the finished one will not add any more data.
 */
export function mergeReadableStreams<T>(
  ...streams: ReadableStream<T>[]
): ReadableStream<T> {
  const resolvePromises = streams.map(() => deferred<void>());
  return new ReadableStream<T>({
    start(controller) {
      Promise.all(resolvePromises).then(() => {
        controller.close();
      });
      for (const [key, stream] of Object.entries(streams)) {
        (async () => {
          try {
            for await (const data of stream) {
              controller.enqueue(data);
            }
            resolvePromises[+key].resolve();
          } catch (error) {
            controller.error(error);
          }
        })();
      }
    },
  });
}
