// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { withoutAll } from "./without_all.ts";
import { withoutAll as unstableWithoutAll } from "./unstable_without_all.ts";

// TODO remove this benchmark before merging
// Edit these arrays to test different scenarios
const a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const b = [2, 4, 6, 8, 10];

Deno.bench({
  name: "withoutAll",
  baseline: true,
  fn: () => {
    withoutAll(a, b);
  },
});

Deno.bench({
  name: "(unstable) withoutAll",
  fn: () => {
    unstableWithoutAll(a, b);
  },
});
