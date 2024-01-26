// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";

class Duration {
  public time: number;
  public unit: "H" | "M" | "S";

  constructor(time: number, unit: "H" | "M" | "S") {
    this.time = time;
    this.unit = unit;
  }

  toString(): string {
    return `[Duration: ${this.time.toString()}${this.unit}]`;
  }

  equals(other: Duration): boolean {
    if (this.unit === other.unit) return this.time === other.time;

    if (
      (this.unit === "H" && other.unit === "M") ||
      (this.unit === "M" && other.unit === "S")
    ) {
      return (this.time * 60) === other.time;
    }

    if ((other.unit === "H" && this.unit === "M") || (other.unit === "M" && this.unit === "S")) {
      return (other.time * 60) === this.time;
    }

    return (this.time * 60 * 60) === other.time;
  }
}

function isDurationMatch(a: Duration, b: Duration) {
  const isDurationA = a instanceof Duration;
  const isDurationB = b instanceof Duration;

  if (isDurationA && isDurationB) return a.equals(b);
  if (isDurationA === isDurationB) return undefined;
  return false;
}

const duration1 = new Duration(1, "S");
const duration2 = new Duration(2, "M");
const duration3 = new Duration(120, "S");

expect.addEqualityTester([isDurationMatch]);

Deno.test("toEqual: basic custom equality test", () => {
  expect(duration1).toEqual(duration1);
  expect(duration1).toEqual(duration3);
  expect(duration1).not.toEqual(duration2);
});

Deno.test("toBe: basic custom equality test", () => {
  expect(duration2).not.toBe(duration1);
  expect(duration3).toBe(duration3);
});

Deno.test("toContain: basic custom equality test", () => {
   expect([duration1]).not.toContain(duration2);
   expect([duration1]).toContain(duration1);
     expect({ a: 1, b: { c: duration2 } }).toMatchObject({
      a: 1,
      b: { c: duration3 },
    });
});
