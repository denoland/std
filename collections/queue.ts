// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/*
 * Queue is a first-in-first-out data structure.
 * Queue supports push on the right and pops on the left,
 * with approximately O(1) performance.
 *
 * Create by optionally passing an Iterable:
 *
 *      const q = Queue([1, 2, 3])
 *      console.log(q.popLeft())  // 1
 *
 */
export class Queue<T> implements Iterable<T> {
  private _array: T[];
  constructor(ls?: Iterable<T>) {
    this._array = ls ? [...ls] : [];
  }
  clear(): void {
    this._array = [];
  }
  peekLeft(): T {
    return this._array[0];
  }
  popLeft(): T {
    return this._array.shift();
  }
  push(value): void {
    this._array.push(value);
  }
  get size(): number {
    return this._array.length;
  }

  [Symbol.iterator]() {
    return this._array[Symbol.iterator]();
  }
}
