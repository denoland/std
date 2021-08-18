// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { deferred } from "../async/deferred.ts";

export function mergeReadableStreams<T>(
  ...streams: ReadableStream<T>[]
): ReadableStream<T> {
  const resolvePromises = streams.map(() => deferred<void>());
  return new ReadableStream<T>({
    start(controller) {
      Promise.all(resolvePromises).then(() => {
        controller.close();
      });
      try {
        for (const [key, stream] of Object.entries(streams)) {
          (async () => {
            for await (const data of stream) {
              controller.enqueue(data);
            }
            resolvePromises[+key].resolve();
          })();
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

export function zipReadableStreams<T>(
  ...streams: ReadableStream<T>[]
): ReadableStream<T> {
  const readers = streams.map((s) => s.getReader());
  return new ReadableStream<T>({
    async start(controller) {
      try {
        let resolved = 0;
        while (resolved != streams.length) {
          for (const [key, reader] of Object.entries(readers)) {
            const { value, done } = await reader.read();
            if (!done) {
              controller.enqueue(value!);
            } else {
              resolved++;
              readers.splice(+key, 1);
            }
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
}
