// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { equals32Bit, equalsNaive } from "./equals.ts";

console.log("generating benchmarks...");
const testCases: [Uint8Array, Uint8Array][] = [];
// CHANGE THESE
const len = 10000;
const nCases = 10000;
for (let i = 0; i < nCases; i++) {
  const arr1 = crypto.getRandomValues(new Uint8Array(len));
  const arr2 = crypto.getRandomValues(new Uint8Array(len));
  const arr3 = arr1.slice(0);
  arr3[arr3.length - 1] = arr1[arr1.length - 1] ^ 1;
  testCases.push([arr1, arr1.slice(0)]);
  testCases.push([arr1, arr2]);
  testCases.push([arr1, arr3]);
}

Deno.bench({
  name: "bench old equals",
  fn() {
    for (const [a, b] of testCases) {
      equalsNaive(a, b);
    }
  },
});

Deno.bench({
  name: "bench simd equals",
  fn() {
    for (const [a, b] of testCases) {
      equals32Bit(a, b);
    }
  },
});
