import {
  bench,
  runBenchmarks,
} from "../testing/bench.ts";

function equalsNaive(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < b.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function equalsSimd(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  const len = a.length;
  const compressable = Math.floor(len / 4);
  const compressedA = new Uint32Array(a.buffer, 0, compressable);
  const compressedB = new Uint32Array(b.buffer, 0, compressable);
  for (let i = compressable * 4; i < len; i++) {
    if (a[i] !== b[i]) return false;
  }
  for (let i = 0; i < compressedA.length; i++) {
    if (compressedA[i] !== compressedB[i]) return false;
  }
  return true;
}

function rand(n: number): number {
  return Math.floor(Math.random() * n);
}

function randArr(len: number): Uint8Array {
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = rand(256);
  }
  return arr;
}

console.log("generating benchmarks...");
const testCases: [Uint8Array, Uint8Array][] = [];
// CHANGE THESE
const len = 10000;
const nCases = 10000;
for (let i = 0; i < nCases; i++) {
  const arr1 = randArr(len);
  const arr2 = randArr(len);
  testCases.push([arr1, arr1.slice(0)]);
  testCases.push([arr1, arr2]);
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

