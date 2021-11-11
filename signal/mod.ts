// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { MuxAsyncIterator } from "../async/mux_async_iterator.ts";
import { deferred } from "../async/deferred.ts";

export type Disposable = { dispose: () => void };

/**
 * Generates an AsyncIterable which can be awaited on for one or more signals.
 * `dispose()` can be called when you are finished waiting on the events.
 *
 * Example:
 *
 * ```ts
 *       import { signal } from "./mod.ts";
 *
 *       const sig = signal("SIGUSR1", "SIGINT");
 *       setTimeout(() => {}, 5000); // Prevents exiting immediately
 *
 *       for await (const _ of sig) {
 *         console.log("interrupt or usr1 signal received");
 *       }
 *
 *       // At some other point in your code when finished listening:
 *       sig.dispose();
 * ```
 *
 * @param signals - one or more signals to listen to
 */
export function signal(
  ...signals: [Deno.Signal, ...Deno.Signal[]]
): AsyncIterable<void> & Disposable {
  const mux = new MuxAsyncIterator<void>();

  if (signals.length < 1) {
    throw new Error(
      "No signals are given. You need to specify at least one signal to create a signal stream.",
    );
  }

  const streams = signals.map(createSignalStream);

  streams.forEach((stream) => {
    mux.add(stream);
  });

  // Create dispose method for the muxer of signal streams.
  const dispose = (): void => {
    streams.forEach((stream) => {
      stream.dispose();
    });
  };

  return Object.assign(mux, { dispose });
}

function createSignalStream(
  signal: Deno.Signal,
): AsyncIterable<void> & Disposable {
  let streamContinues = deferred<boolean>();
  const handler = () => {
    streamContinues.resolve(true);
  };
  Deno.addSignalListener(signal, handler);

  const gen = async function* () {
    while (await streamContinues) {
      streamContinues = deferred<boolean>();
      yield undefined;
    }
  };

  return Object.assign(gen(), {
    dispose() {
      streamContinues.resolve(false);
      Deno.removeSignalListener(signal, handler);
    },
  });
}

/**
 * Registers a callback function to be called on triggering of a signal event.
 *
 * ```ts
 *       import { onSignal } from "./mod.ts";
 *
 *       const handle = onSignal("SIGINT", () => {
 *         console.log('Received SIGINT');
 *         handle.dispose();  // de-register from receiving further events
 *       });
 * ```
 *
 * @param signo One of Deno.Signal (e.g. "SIGINT")
 * @param callback Callback function triggered upon signal event
 * @deprecated Use Deno.addSignalListener and Deno.removeSignalListener instead.
 */
export function onSignal(
  signal: Deno.Signal,
  callback: () => void,
): Disposable {
  Deno.addSignalListener(signal, callback);

  return {
    dispose() {
      Deno.removeSignalListener(signal, callback);
    },
  };
}
