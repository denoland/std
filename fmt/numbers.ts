// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// A module to format numbers.

/** Add zeros to the beginning of a number till it reaches a certain digit count. */
export function addZero(num: number, digits = 3): string {
  const arr = new Array(digits).fill(0);
  return `${arr.join("").slice(0, 0 - num.toString().length)}${num}`;
}
