// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { slidingWindows } from "./sliding_windows.ts";
import { slidingWindows as unstableSlidingWindows } from "./unstable_sliding_windows.ts";

const arraySize = [10, 100, 1_000, 10_000, 100_000, 1_000_000];

for (const len of arraySize) {
  const array = Array.from({ length: len }, (_, i) => i);
  const group = `${len} elements`;
  const size = 7;

  Deno.bench({
    name: "slidingWindows",
    group,
    fn: () => {
      slidingWindows(array, size);
    },
  });

  Deno.bench({
    name: "(unstable) slidingWindows",
    group,
    baseline: true,
    fn: () => {
      unstableSlidingWindows(array, size);
    },
  });
}
