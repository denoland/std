import * as array from "./chunk.ts";
import * as iterable from "./unstable_chunk.ts";

// TODO remove before merging

const chunkSize = 10;
const count = 100_000;
const arr = Array.from({ length: count }, (_, i) => i);
const uInt32Arr = new Uint32Array(arr);

Deno.bench({
  name: "chunk only arr",
  fn: () => {
    array.chunk(arr, chunkSize);
  },
});

Deno.bench({
  name: "chunk iterable",
  fn: () => {
    iterable.chunk(arr, chunkSize);
  },
});

Deno.bench({
  name: "chunk uInt32Arr",
  fn: () => {
    iterable.chunk(uInt32Arr, chunkSize);
  },
});
