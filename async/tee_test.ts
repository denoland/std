// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { tee } from "./tee.ts";
import { assertEquals } from "../testing/asserts.ts";

/** An example async generator */
const gen = async function* iter() {
  yield 1;
  yield 2;
  yield 3;
};

/** Testing utility for accumulating the values in async iterable. */
async function accumulate<T>(src: AsyncIterable<T>): Promise<T[]> {
  const res: T[] = [];
  for await (const item of src) {
    res.push(item);
  }
  return res;
}

Deno.test("async/tee - 2 branches", async () => {
  const iter = gen();
  const [res0, res1] = tee(iter).map(accumulate);
  assertEquals(
    await Promise.all([res0, res1]),
    [
      [1, 2, 3],
      [1, 2, 3],
    ],
  );
});

Deno.test("async/tee - 3 branches - immediate consumption", async () => {
  const iter = gen();
  const [res0, res1, res2] = tee(iter, 3).map(accumulate);
  assertEquals(
    await Promise.all([res0, res1, res2]),
    [
      [1, 2, 3],
      [1, 2, 3],
      [1, 2, 3],
    ],
  );
});

Deno.test("async/tee - 3 branches - delayed consumption", async () => {
  const iter = gen();
  const iters = tee(iter, 3);

  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 20);
  });

  assertEquals(
    await Promise.all(iters.map(accumulate)),
    [
      [1, 2, 3],
      [1, 2, 3],
      [1, 2, 3],
    ],
  );
});

Deno.test("async/tee - concurent .next calls", async () => {
  const [left] = tee(gen());
  const l = left[Symbol.asyncIterator]();
  assertEquals(await Promise.all([l.next(), l.next(), l.next(), l.next()]), [{
    value: 1,
    done: false,
  }, {
    value: 2,
    done: false,
  }, {
    value: 3,
    done: false,
  }, {
    value: undefined,
    done: true,
  }]);
});
