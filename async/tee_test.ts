// Copyright 2018-2025 the Deno authors. MIT license.
import { tee } from "./tee.ts";
import { assertEquals } from "@std/assert";

/** An example async generator */
const gen = async function* iter() {
  yield 1;
  yield 2;
  yield 3;
};

Deno.test("tee() handles 2 branches", async () => {
  const iter = gen();
  const [res0, res1] = tee(iter).map(async (src) => await Array.fromAsync(src));
  assertEquals(
    await Promise.all([res0, res1]),
    [
      [1, 2, 3],
      [1, 2, 3],
    ],
  );
});

Deno.test("tee() handles 3 branches with immediate consumption", async () => {
  const iter = gen();
  const [res0, res1, res2] = tee(iter, 3).map(async (src) =>
    await Array.fromAsync(src)
  );
  assertEquals(
    await Promise.all([res0, res1, res2]),
    [
      [1, 2, 3],
      [1, 2, 3],
      [1, 2, 3],
    ],
  );
});

Deno.test("tee() handles 3 branches with delayed consumption", async () => {
  const iter = gen();
  const iters = tee(iter, 3);

  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 20);
  });

  assertEquals(
    await Promise.all(iters.map(async (src) => await Array.fromAsync(src))),
    [
      [1, 2, 3],
      [1, 2, 3],
      [1, 2, 3],
    ],
  );
});

Deno.test("tee() handles concurrent next() calls", async () => {
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
