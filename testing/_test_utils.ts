// Copyright 2018-2026 the Deno authors. MIT license.
export class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  // deno-lint-ignore no-explicit-any
  action(...args: any[]): any {
    return args[0];
  }
  toString(): string {
    return [this.x, this.y].join(", ");
  }
  explicitTypes(_x: number, _y: string) {
    return true;
  }
  *[Symbol.iterator](): IterableIterator<number> {
    yield this.x;
    yield this.y;
  }
}

export function stringifyPoint(point: Point) {
  return point.toString();
}

export type PointWithExtra = Point & {
  nonExistent: () => number;
};
