import { slidingWindows } from "./sliding_windows.ts";
import { slidingWindows as unstableSlidingWindows, slidingWindowsIter } from "./unstable_sliding_windows.ts";

const array = Array.from({ length: 1_000_000 }, () => Math.random());

Deno.bench({
  name: "slidingWindows",
  group: "array",
  fn: () => {
    slidingWindows(array, 3);
  },
});


Deno.bench({
  name: "(unstable) slidingWindows",
  group: "array",
  fn: () => {
    unstableSlidingWindows(array, 3);
  },
});

Deno.bench({
  name: "(unstable) slidingWindows iter",
  group: "array",
  fn: () => {
    slidingWindowsIter(array, 3);
  },
});



function* gen() {
  for (let i = 0; i < 1_000; i++) {
    yield i;
  }
}


Deno.bench({
  name: "(unstable) slidingWindows",
  group: "iter",
  fn: () => {
    unstableSlidingWindows(gen(), 3);
  },
});

Deno.bench({
  name: "(unstable) slidingWindows iter",
  group: "iter",
  fn: () => {
    slidingWindowsIter(gen(), 3);
  },
});

