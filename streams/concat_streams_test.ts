// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../assert/mod.ts";
import { ConcatStreams } from "./concat_streams.ts";

Deno.test("new ConcatStreams(streams)", async function () {
  const gen1 = async function* () {
    for (let i = 0; i < 10; ++i) {
      yield i;
    }
  }();
  const gen2 = async function* () {
    for (let i = 10; i < 20; ++i) {
      yield i;
    }
  }();
  const gen3 = async function* () {
    for (let i = 20; i < 30; ++i) {
      yield i;
    }
  }();

  assertEquals(
    await Array.fromAsync(new ConcatStreams([gen1, gen2, gen3]).readable),
    [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
    ],
  );
});

Deno.test("new ConcatStreams(streams) with empty streams", async function () {
  const gen1 = async function* () {
  }();
  const gen2 = async function* () {
  }();
  const gen3 = async function* () {
  }();

  assertEquals(
    await Array.fromAsync(new ConcatStreams([gen1, gen2, gen3]).readable),
    [],
  );
});

Deno.test("new ConcatStreams(streams) with one empty stream", async function () {
  const gen1 = async function* () {
    for (let i = 0; i < 10; ++i) {
      yield i;
    }
  }();
  const gen2 = async function* () {
  }();
  const gen3 = async function* () {
    for (let i = 20; i < 30; ++i) {
      yield i;
    }
  }();

  assertEquals(
    await Array.fromAsync(new ConcatStreams([gen1, gen2, gen3]).readable),
    [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
    ],
  );
});

Deno.test(".pipeThrough(new ConcatStreams())", async function () {
  const gen1 = async function* () {
    for (let i = 0; i < 10; ++i) {
      yield i;
    }
  }();
  const gen2 = async function* () {
    for (let i = 10; i < 20; ++i) {
      yield i;
    }
  }();
  const gen3 = async function* () {
    for (let i = 20; i < 30; ++i) {
      yield i;
    }
  }();

  assertEquals(
    await Array.fromAsync(
      ReadableStream.from([gen1, gen2, gen3]).pipeThrough(new ConcatStreams()),
    ),
    [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
    ],
  );
});

Deno.test(".pipeThrough(new ConcatStreams()) with empty streams", async function () {
  const gen1 = async function* () {
  }();
  const gen2 = async function* () {
  }();
  const gen3 = async function* () {
  }();

  assertEquals(
    await Array.fromAsync(
      ReadableStream.from([gen1, gen2, gen3]).pipeThrough(new ConcatStreams()),
    ),
    [],
  );
});

Deno.test(".pipeThrough(new ConcatStreams()) with one empty stream", async function () {
  const gen1 = async function* () {
    for (let i = 0; i < 10; ++i) {
      yield i;
    }
  }();
  const gen2 = async function* () {
  }();
  const gen3 = async function* () {
    for (let i = 20; i < 30; ++i) {
      yield i;
    }
  }();

  assertEquals(
    await Array.fromAsync(
      ReadableStream.from([gen1, gen2, gen3]).pipeThrough(new ConcatStreams()),
    ),
    [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
    ],
  );
});

Deno.test(".pipeThrough(new ConcatStreams()) handles errors", async () => {
  const gen1 = async function* () {
    for (let i = 0; i < 10; ++i) {
      yield i;
    }
  }();
  const gen2 = async function* () {
    for (let i = 10; i < 20; ++i) {
      yield i;
    }
    throw new TypeError("I am an error.");
  }();
  const gen3 = async function* () {
    for (let i = 20; i < 30; ++i) {
      yield i;
    }
  }();

  const concatStream = ReadableStream
    .from([gen1, gen2, gen3])
    .pipeThrough(new ConcatStreams());
  const results: number[] = [];
  await assertRejects(
    async () => {
      for await (const value of concatStream) {
        results.push(value);
      }
    },
    TypeError,
    "I am an error.",
  );
  assertEquals(
    results,
    [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
    ],
  );
});
