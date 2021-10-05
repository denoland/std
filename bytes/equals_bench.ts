import { bench, runBenchmarks } from "../testing/bench.ts";
import { equalsNaive, equalsSimd } from "./equals.ts";

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

bench({
  name: "bench old equals",
  func(b): void {
    b.start();
    for (const [a, b] of testCases) {
      equalsNaive(a, b);
    }
    b.stop();
  },
});

bench({
  name: "bench simd equals",
  func(b): void {
    b.start();
    for (const [a, b] of testCases) {
      equalsSimd(a, b);
    }
    b.stop();
  },
});

runBenchmarks();
