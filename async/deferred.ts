export type Deferred<T = any, R = Error> = {
  promise: Promise<T>;
  resolve: (t?: T) => void;
  reject: (r?: R) => void;
};

/** Create deferred promise that can be resolved and rejected by outside */
export function defer<T>(): Deferred<T> {
  let resolve = () => {};
  let reject = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
