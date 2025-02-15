// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { ProgressBar } from "./unstable_progress_bar.ts";

async function* getData(
  loops: number,
  bufferSize: number,
): AsyncGenerator<Uint8Array> {
  for (let i = 0; i < loops; ++i) {
    yield new Uint8Array(bufferSize);
    await new Promise((a) => setTimeout(a, Math.random() * 500 + 500));
  }
}

Deno.test("ProgressBar() outputs default result", async () => {
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar(writable, { max: 10 * 1000 });

  for await (const a of getData(10, 1000)) bar.add(a.length);
  bar.stop().then(() => writable.close());

  for await (const buffer of readable) {
    if (buffer.length == 1) {
      assertEquals(buffer[0], 10);
      continue;
    }
    assertEquals(buffer.subarray(0, 4), Uint8Array.from([13, 27, 91, 75]));
    let i = 4;
    // Check Time
    assertEquals(buffer[i++], 91); // [
    assertEquals(48 <= buffer[i] && buffer[i++] <= 58, true); // 0-9
    assertEquals(48 <= buffer[i] && buffer[i++] <= 58, true); // 0-9
    assertEquals(buffer[i++], 58); // :
    assertEquals(48 <= buffer[i] && buffer[i++] <= 58, true); // 0-9
    assertEquals(48 <= buffer[i] && buffer[i++] <= 58, true); // 0-9
    assertEquals(buffer[i++], 93); // ]
    assertEquals(buffer[i++], 32); // ' '
    // Check Progress Bar
    assertEquals(buffer[i++], 91); // []
    for (let j = 0; j < 50; ++j, ++i) {
      assertEquals(buffer[i] === 35 || buffer[i] === 45, true); // '#' || '-'
    }
    assertEquals(buffer[i++], 93); // ]
    assertEquals(buffer[i++], 32); // ' '
    // Check Amount
    assertEquals(buffer[i++], 91); // [
    assertEquals(48 <= buffer[i] && buffer[i++] <= 58, true); // 0-9
    assertEquals(buffer[i++], 46); // .
    assertEquals(48 <= buffer[i] && buffer[i++] <= 58, true); // 0-9
    assertEquals(48 <= buffer[i] && buffer[i++] <= 58, true); // 0-9
    assertEquals(buffer[i++], 47); // /
    assertEquals(48 <= buffer[i] && buffer[i++] <= 58, true); // 0.9
    assertEquals(buffer[i++], 46); // .
    assertEquals(48 <= buffer[i] && buffer[i++] <= 58, true); // 0-9
    assertEquals(48 <= buffer[i] && buffer[i++] <= 58, true); // 0-9
    assertEquals(buffer[i++], 32); // ' '
    assertEquals(buffer[i++], 75); // K
    assertEquals(buffer[i++], 105); // i
    assertEquals(buffer[i++], 66); // B
    assertEquals(buffer[i++], 93); // ]
  }
});

Deno.test("ProgressBar() can handle a readable.cancel() correctly", async () => {
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar(writable, { max: 10 * 1000 });

  for await (const a of getData(10, 1000)) bar.add(a.length);
  bar.stop();

  await readable.cancel();
});

Deno.test("ProgressBar() can remove itself when finished", async () => {
  const { readable, writable } = new TransformStream();
  const bar = new ProgressBar(writable, {
    max: 10 * 1000,
    clear: true,
  });

  for await (const a of getData(10, 1000)) bar.add(a.length);
  bar.stop()
    .then(() => writable.close());

  for await (const buffer of readable) {
    assertEquals(buffer.subarray(0, 4), Uint8Array.from([13, 27, 91, 75]));
  }
});

Deno.test("ProgressBar() passes correct values to formatter", async () => {
  const { readable, writable } = new TransformStream();
  let lastTime: undefined | number = undefined;
  let lastValue: undefined | number = undefined;
  const bar = new ProgressBar(writable, {
    max: 10 * 1000,
    keepOpen: false,
    fmt(x) {
      if (lastTime != undefined) assertEquals(x.previousTime, lastTime);
      if (lastValue != undefined) assertEquals(x.previousValue, lastValue);
      lastTime = x.time;
      lastValue = x.value;
      return "";
    },
  });

  for await (const a of getData(10, 1000)) bar.add(a.length);
  bar.stop();

  await new Response(readable).bytes();
});

Deno.test("ProgressBar() uses correct unit type", async () => {
  const units = ["KiB", "MiB", "GiB", "TiB", "PiB"];
  let i = 0;
  for (const unit of units) {
    const { readable, writable } = new TransformStream();
    const bar = new ProgressBar(writable, {
      max: 2 ** (10 * ++i),
      keepOpen: false,
    });

    const decoder = new TextDecoder();
    for await (const buffer of readable) {
      assertEquals(decoder.decode(buffer.subarray(-5, -2)), unit);
      break;
    }
    bar.stop();
  }
});
