// Copyright 2018-2025 the Deno authors. MIT license.
import { nextFloat64, nextInteger } from "./number_types.ts";
import { seededByteGenerator } from "./seeded.ts";
import { Pcg32 } from "./_pcg32.ts";
import { assertEquals } from "@std/assert";

Deno.test("nextInteger() generates the requested integer types", () => {
  const byteGenerator = seededByteGenerator(1n);
  assertEquals(nextInteger(byteGenerator, "Uint32"), 866585574);
  assertEquals(nextInteger(byteGenerator, "Int16"), -3090);
  assertEquals(nextInteger(byteGenerator, "Int16"), 18257);
  assertEquals(
    nextInteger(byteGenerator, "BigUint64"),
    17942321377934340544n,
  );
});

Deno.test('nextInteger() with "Uint32" generates the same values as Pcg32\'s `nextUint32`', () => {
  const pcg = Pcg32.seedFromUint64(1n);
  const byteGenerator = pcg.getRandomValues.bind(pcg);
  let state = pcg.state;

  for (let i = 0; i < 10; ++i) {
    const a = pcg.nextUint32();
    pcg.state = state;
    const b = nextInteger(byteGenerator, "Uint32");
    assertEquals(a, b);
    state = pcg.state;
  }
});

Deno.test("nextFloat64() generates floats", () => {
  const byteGenerator = seededByteGenerator(1n);
  assertEquals(nextFloat64(byteGenerator), 0.49116444173310125);
  assertEquals(nextFloat64(byteGenerator), 0.06903754193160427);
  assertEquals(nextFloat64(byteGenerator), 0.16063206851777034);
});
