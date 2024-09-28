import { dropLastWhile } from "./drop_last_while.ts";
import {
  dropLastWhile as unstableDropLastWhile,
} from "./unstable_drop_last_while.ts";

const arr = Array.from({ length: 1_000 }, (_, i) => i);
const predicate = (number: number) => number > 500;

Deno.bench({
  name: "dropLastWhile",
  baseline: true,
  fn: () => {
    dropLastWhile(arr, predicate);
  },
});

Deno.bench({
  name: "(unstable) dropLastWhile",
  fn: () => {
    unstableDropLastWhile(arr, predicate);
  },
});
