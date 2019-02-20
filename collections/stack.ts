// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/*
 * Stack is a first-in-last-out data structure.
 * Stack supports push on the right and pops on the right,
 * with approximately O(1) performance.
 *
 * Create by optionally passing an Iterable:
 *
 *      const s = Stack([1, 2, 3])
 *      console.log(s.pop())  // 3
 *
 */
export class Stack<T> implements Iterable<T> {
  private _array: T[];
  constructor(ls?: Iterable<T>) {
    this._array = ls ? [...ls] : [];
  }
  clear(): void {
    this._array = [];
  }
  peek(): T {
    return this._array[this._array.length - 1];
  }
  pop(): T {
    return this._array.pop();
  }
  push(value): void {
    this._array.push(value);
  }
  get size(): number {
    return this._array.length;
  }

  [Symbol.iterator]() {
    const arr = this._array;
    let index = arr.length;
    return {
      next: function() {
        index--;
        return {
          done: index < 0,
          value: arr[index]
        };
      }
    };
  }
}
