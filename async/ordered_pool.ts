// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * orderedPooledMap is a variation of pooledMap that returns the original
 * element along with the result of applying the provided function to it.
 *
 * Unlike pooledMap, this function continues to map elements after an attempt
 * fails. All failures are accumulated and thrown as an AggregateError.
 *
 * @param poolLimit The maximum count of items being processed concurrently.
 * @param array The input array for mapping.
 * @param iteratorFn The async function to call for every item of the array.
 */
export function orderedPooledMap<T, R>(
  poolLimit: number,
  array: Iterable<T> | AsyncIterable<T>,
  iteratorFn: (data: T) => Promise<R>,
) {
  // Create the readable stream whose async iterable is returned from this function.
  const readable = new ReadableStream<[T, R]>({
    async start(controller: ReadableStreamDefaultController<[T, R]>) {
      // container for pending applications
      const executing: Array<Promise<unknown>> = [];

      // container for errors thrown by the iterator function
      const errors: Array<[T, Error]> = [];

      for await (const item of array) {
        const exe = iteratorFn(item)
          // Only write on success.
          .then((result) => controller.enqueue([item, result]))
          // If we `controller.enqueue()` a rejected promise,
          // that will end the iteration. We don't want that yet.
          // Instead accumulate rejections in an array, and all
          // rejections among them can be reported together.
          .catch((reason) => errors.push([item, reason]))
          // remove self from executing when resolved or rejected
          .finally(() => executing.splice(executing.indexOf(exe), 1));

        executing.push(exe);

        if (executing.length >= poolLimit) await Promise.race(executing);
      }

      // Wait until all ongoing events have processed, then close the readable stream or throw.
      await Promise.all(executing);

      if (errors.length > 0) {
        throw new AggregateError(errors, "Threw while mapping.");
      }

      controller.close();
    },
  });

  return readable[Symbol.asyncIterator]();
}
