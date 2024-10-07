import { slidingWindows } from "./sliding_windows.ts";
import { slidingWindows as unstableSlidingWindows } from "./unstable_sliding_windows.ts";

const array = new Array(1_000).map((_, i) => i);

console.log(array);
Deno.bench({
  name: "slidingWindows",
  fn: () => {
    slidingWindows(array, 10);
  },
});

Deno.bench({
  name: "(unstable) slidingWindows",
  fn: () => {
    unstableSlidingWindows(array, 10);
  },
});
