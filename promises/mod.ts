// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

export type Deferred<T = any, R = Error> = {
  promise: Promise<T>;
  resolve: (t?: T) => void;
  reject: (r?: R) => void;
  readonly handled: boolean;
};

/** Create deferred promise that can be resolved and rejected by outside */
export function defer<T>(): Deferred<T> {
  let handled = false;
  let resolve;
  let reject;
  const promise = new Promise<T>((res, rej) => {
    resolve = r => {
      handled = true;
      res(r);
    };
    reject = r => {
      handled = true;
      rej(r);
    };
  });
  return {
    promise,
    resolve,
    reject,
    get handled() {
      return handled;
    }
  };
}

export function delay<T>(ms: number, value?: T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      resolve(value);
    }, ms);
  });
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    const message = `Timeout after ${ms}ms`;
    super(message);
    this.name = "TimeoutError";
  }
}

export function timeout<T>(ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(ms));
    }, ms);
  });
}
