// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2014-2021 Sindre Sorhus. All rights reserved. MIT license.
// Copyright 2021 Yoshiya Hinosawa. All rights reserved. MIT license.

import { format } from "./bytes.ts";
import { assertEquals, assertThrows } from "@std/assert";
import { stub } from "@std/testing/mock";

const parts = new Intl.NumberFormat().formatToParts(10000.1);
const decimal = parts.find(({ type }) => type === "decimal")!.value;

Deno.test("format() throws on invalid input", () => {
  // deno-lint-ignore no-explicit-any
  assertThrows(() => format("" as any));
  // deno-lint-ignore no-explicit-any
  assertThrows(() => format("1" as any));
  assertThrows(() => format(NaN));
  // deno-lint-ignore no-explicit-any
  assertThrows(() => format(true as any));
  assertThrows(() => format(Infinity));
  assertThrows(() => format(-Infinity));
  // deno-lint-ignore no-explicit-any
  assertThrows(() => format(null as any));
});

Deno.test("format() converts bytes to human readable strings", () => {
  assertEquals(format(0), "0 B");
  assertEquals(format(0.4), "0.4 B");
  assertEquals(format(0.7), "0.7 B");
  assertEquals(format(10), "10 B");
  assertEquals(format(10.1), "10.1 B");
  assertEquals(format(999), "999 B");
  assertEquals(format(1001), "1 kB");
  assertEquals(format(1001), "1 kB");
  assertEquals(format(1e16), "10 PB");
  assertEquals(format(1e30), "1000000 YB");
});

Deno.test("format() supports negative number", () => {
  assertEquals(format(-0.4), "-0.4 B");
  assertEquals(format(-0.7), "-0.7 B");
  assertEquals(format(-10.1), "-10.1 B");
  assertEquals(format(-999), "-999 B");
  assertEquals(format(-1001), "-1 kB");
});

Deno.test("format() handles locale option", () => {
  assertEquals(format(-0.4, { locale: "de" }), "-0,4 B");
  assertEquals(format(0.4, { locale: "de" }), "0,4 B");
  assertEquals(format(1001, { locale: "de" }), "1 kB");
  assertEquals(format(10.1, { locale: "de" }), "10,1 B");
  assertEquals(format(1e30, { locale: "de" }), "1.000.000 YB");

  assertEquals(format(-0.4, { locale: "en" }), "-0.4 B");
  assertEquals(format(0.4, { locale: "en" }), "0.4 B");
  assertEquals(format(1001, { locale: "en" }), "1 kB");
  assertEquals(format(10.1, { locale: "en" }), "10.1 B");
  assertEquals(format(1e30, { locale: "en" }), "1,000,000 YB");

  assertEquals(
    format(-0.4, { locale: ["unknown", "de", "en"] }),
    "-0,4 B",
  );
  assertEquals(format(0.4, { locale: ["unknown", "de", "en"] }), "0,4 B");
  assertEquals(format(1001, { locale: ["unknown", "de", "en"] }), "1 kB");
  assertEquals(
    format(10.1, { locale: ["unknown", "de", "en"] }),
    "10,1 B",
  );
  assertEquals(
    format(1e30, { locale: ["unknown", "de", "en"] }),
    "1.000.000 YB",
  );

  assertEquals(format(-0.4, { locale: true }), `-0${decimal}4 B`);
  assertEquals(format(0.4, { locale: true }), `0${decimal}4 B`);
  assertEquals(format(1001, { locale: true }), "1 kB");
  assertEquals(format(10.1, { locale: true }), `10${decimal}1 B`);

  assertEquals(format(-0.4, { locale: false }), "-0.4 B");
  assertEquals(format(0.4, { locale: false }), "0.4 B");
  assertEquals(format(1001, { locale: false }), "1 kB");
  assertEquals(format(10.1, { locale: false }), "10.1 B");
  assertEquals(format(1e30, { locale: false }), "1000000 YB");

  // @ts-expect-error: explicitly giving undefined
  assertEquals(format(-0.4, { locale: undefined }), "-0.4 B");
  // @ts-expect-error: explicitly giving undefined
  assertEquals(format(0.4, { locale: undefined }), "0.4 B");
  // @ts-expect-error: explicitly giving undefined
  assertEquals(format(1001, { locale: undefined }), "1 kB");
  // @ts-expect-error: explicitly giving undefined
  assertEquals(format(10.1, { locale: undefined }), "10.1 B");
  // @ts-expect-error: explicitly giving undefined
  assertEquals(format(1e30, { locale: undefined }), "1000000 YB");

  assertEquals(format(-0.4, {}), "-0.4 B");
  assertEquals(format(0.4, {}), "0.4 B");
  assertEquals(format(1001, {}), "1 kB");
  assertEquals(format(10.1, {}), "10.1 B");
  assertEquals(format(1e30, {}), "1000000 YB");
});

Deno.test("format() handles group separators", async (t) => {
  const tests: { locale: string; expected: string }[] = [
    { locale: "en-US", expected: "1,000,000 YB" },
    { locale: "es-ES", expected: "1.000.000 YB" },

    // narrow non-breaking space
    { locale: "fr-FR", expected: "1\u202f000\u202f000 YB" },

    // non-breaking space
    { locale: "pl-PL", expected: "1\u00A0000\u00A0000 YB" },

    // https://en.wikipedia.org/wiki/Indian_numbering_system
    { locale: "hi-IN", expected: "10,00,000 YB" },
    { locale: "gu-IN", expected: "10,00,000 YB" },
  ];

  for (const { locale, expected } of tests) {
    await t.step(locale, () => {
      const toLocaleString = Number.prototype.toLocaleString;
      using _ = stub(
        Number.prototype,
        "toLocaleString",
        function (loc) {
          return toLocaleString.call(this, loc ?? locale);
        },
      );

      // explicitly supplying the locale
      assertEquals(format(1e30, { locale }), expected);
      // using the default locale (mocked with stub)
      assertEquals(format(1e30, { locale: true }), expected);
    });
  }
});

Deno.test("format() handles signed option", () => {
  assertEquals(format(42, { signed: true }), "+42 B");
  assertEquals(format(-13, { signed: true }), "-13 B");
  assertEquals(format(0, { signed: true }), " 0 B");
});

Deno.test("format() handles bits option", () => {
  assertEquals(format(0, { bits: true }), "0 b");
  assertEquals(format(0.4, { bits: true }), "0.4 b");
  assertEquals(format(0.7, { bits: true }), "0.7 b");
  assertEquals(format(10, { bits: true }), "10 b");
  assertEquals(format(10.1, { bits: true }), "10.1 b");
  assertEquals(format(999, { bits: true }), "999 b");
  assertEquals(format(1001, { bits: true }), "1 kbit");
  assertEquals(format(1001, { bits: true }), "1 kbit");
  assertEquals(format(1e16, { bits: true }), "10 Pbit");
  assertEquals(format(1e30, { bits: true }), "1000000 Ybit");
});

Deno.test("format() handles binary option", () => {
  assertEquals(format(0, { binary: true }), "0 B");
  assertEquals(format(4, { binary: true }), "4 B");
  assertEquals(format(10, { binary: true }), "10 B");
  assertEquals(format(10.1, { binary: true }), "10.1 B");
  assertEquals(format(999, { binary: true }), "999 B");
  assertEquals(format(1025, { binary: true }), "1 kiB");
  assertEquals(format(1001, { binary: true }), "1000 B");
  assertEquals(format(1e16, { binary: true }), "8.88 PiB");
  assertEquals(format(1e30, { binary: true }), "827000 YiB");
});

Deno.test("format() handles bits and binary option", () => {
  assertEquals(format(0, { bits: true, binary: true }), "0 b");
  assertEquals(format(4, { bits: true, binary: true }), "4 b");
  assertEquals(format(10, { bits: true, binary: true }), "10 b");
  assertEquals(format(999, { bits: true, binary: true }), "999 b");
  assertEquals(format(1025, { bits: true, binary: true }), "1 kibit");
  assertEquals(format(1e6, { bits: true, binary: true }), "977 kibit");
});

Deno.test("format() handles fractional digits options", () => {
  assertEquals(
    format(1900, { maximumFractionDigits: 1 }),
    `1${decimal}9 kB`,
  );
  assertEquals(
    format(1900, { minimumFractionDigits: 3 }),
    `1${decimal}900 kB`,
  );
  assertEquals(
    format(1911, { maximumFractionDigits: 1 }),
    `1${decimal}9 kB`,
  );
  assertEquals(
    format(1111, { maximumFractionDigits: 2 }),
    `1${decimal}11 kB`,
  );
  assertEquals(
    format(1019, { maximumFractionDigits: 3 }),
    `1${decimal}019 kB`,
  );
  assertEquals(
    format(1001, { maximumFractionDigits: 3 }),
    `1${decimal}001 kB`,
  );
  assertEquals(
    format(1000, { minimumFractionDigits: 1, maximumFractionDigits: 3 }),
    `1${decimal}0 kB`,
  );
  assertEquals(
    format(3942, { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
    `3${decimal}94 kB`,
  );
  assertEquals(
    format(4001, { maximumFractionDigits: 3, binary: true }),
    `3${decimal}907 kiB`,
  );
  assertEquals(
    format(18717, { maximumFractionDigits: 2, binary: true }),
    `18${decimal}28 kiB`,
  );
  assertEquals(
    format(18717, { maximumFractionDigits: 4, binary: true }),
    `18${decimal}2783 kiB`,
  );
  assertEquals(
    format(32768, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
      binary: true,
    }),
    `32${decimal}00 kiB`,
  );
  assertEquals(
    format(65536, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 3,
      binary: true,
    }),
    `64${decimal}0 kiB`,
  );
});
