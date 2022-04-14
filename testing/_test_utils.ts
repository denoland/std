// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
export class Point {
  constructor(public x: number, public y: number) {}
  // deno-lint-ignore no-explicit-any
  action(...args: any[]): any {
    return args[0];
  }
  toString(): string {
    return [this.x, this.y].join(", ");
  }
  *[Symbol.iterator](): IterableIterator<number> {
    yield this.x;
    yield this.y;
  }
}

export function stringifyPoint(point: Point) {
  return point.toString();
}
