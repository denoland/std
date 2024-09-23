import { intersect } from "./intersect.ts";
import {
    intersect as unstableIntersect,
    intersectSetBased as unstableIntersectSetBased,
} from "./unstable_intersect.ts";

const a = [1, 2, 3, 4, 5];
const b = [2, 3, 4, 5, 6];
const c = [3, 4, 5, 6, 7];

Deno.bench({
    name: "intersect",
    fn: () => {
        intersect(a, b, c);
    },
});

Deno.bench({
    name: "(unstable) intersect",
    baseline: true,
    fn: () => {
        unstableIntersect(a, b, c);
    },
});

Deno.bench({
    name: "(unstable) intersect using set.intersection",
    fn: () => {
        unstableIntersectSetBased(a, b, c);
    },
});
