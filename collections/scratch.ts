import { takeLastWhile } from "./take_last_while.ts";

const arr = [-1, -2, -3, -4, -5, -6];

const actual = takeLastWhile(arr, (i) => i < -4);

console.log(actual)
