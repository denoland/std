// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { sample } from "./sample.ts";
import { sample as unstableSample } from "././unstable_sample.ts";

// TODO remove this benchmark before merging
// Edit these arrays to test different scenarios
const iterable = Array.from({ length: 1_000 }, (_, i) => i);

Deno.bench({
  name: "sample",
  baseline: true,
  fn: () => {
    sample(iterable);
  },
});

Deno.bench({
  name: "(unstable) sample",
  fn: () => {
    unstableSample(iterable);
  },
});
