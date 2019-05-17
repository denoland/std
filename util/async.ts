// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

// TODO(ry) It'd be better to make Deferred a class that inherits from
// Promise, rather than an interface. This is possible in ES2016, however
// typescript produces broken code when targeting ES5 code.
// See https://github.com/Microsoft/TypeScript/issues/15202
// At the time of writing, the github issue is closed but the problem remains.
export interface Deferred<T> extends Promise<T> {
  resolve: (value?: T | PromiseLike<T>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: (reason?: any) => void;
}

/** Creates a Promise with the `reject` and `resolve` functions
 * placed as methods on the promise object itself. It allows you to do:
 *
 *     const p = deferred<number>();
 *     // ...
 *     p.resolve(42);
 */
export function deferred<T>(): Deferred<T> {
  let methods;
  const promise = new Promise<T>(
    (resolve, reject): void => {
      methods = { resolve, reject };
    }
  );
  return Object.assign(promise, methods) as Deferred<T>;
}

/** Sends objects between asynchronous tasks, with backpressure. */
export class Channel<T> {
  // TODO(ry) Can Channel be implemented without using Arrays?
  private sendQueue: Array<[() => void, T]> = [];
  private recvQueue: Array<(value: T) => void> = [];

  send(value: T): Promise<void> {
    const recvResolve = this.recvQueue.shift();
    if (recvResolve) {
      recvResolve(value);
      return Promise.resolve();
    } else {
      return new Promise(
        (resolve, _): void => {
          this.sendQueue.push([resolve, value]);
        }
      );
    }
  }

  recv(): Promise<T> {
    const s = this.sendQueue.shift();
    if (s) {
      const [sendResolve, value] = s;
      sendResolve();
      return Promise.resolve(value);
    } else {
      return new Promise(
        (res, _): void => {
          this.recvQueue.push(res);
        }
      );
    }
  }
}
