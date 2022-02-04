// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright 2014-2021 Sindre Sorhus. All rights reserved. MIT license.
// Copyright 2021 Yoshiya Hinosawa. All rights reserved. MIT license.

import { prettyBytes } from "./bytes.ts";
import { assertEquals, assertThrows } from "../testing/asserts.ts";

Deno.test("throws on invalid input", () => {
  // deno-lint-ignore no-explicit-any
  assertThrows(() => prettyBytes("" as any));
  // deno-lint-ignore no-explicit-any
  assertThrows(() => prettyBytes("1" as any));
  assertThrows(() => prettyBytes(NaN));
  // deno-lint-ignore no-explicit-any
  assertThrows(() => prettyBytes(true as any));
  assertThrows(() => prettyBytes(Infinity));
  assertThrows(() => prettyBytes(-Infinity));
  // deno-lint-ignore no-explicit-any
  assertThrows(() => prettyBytes(null as any));
});

Deno.test("converts bytes to human readable strings", () => {
  assertEquals(prettyBytes(0), "0 B");
  assertEquals(prettyBytes(0.4), "0.4 B");
  assertEquals(prettyBytes(0.7), "0.7 B");
  assertEquals(prettyBytes(10), "10 B");
  assertEquals(prettyBytes(10.1), "10.1 B");
  assertEquals(prettyBytes(999), "999 B");
  assertEquals(prettyBytes(1001), "1 kB");
  assertEquals(prettyBytes(1001), "1 kB");
  assertEquals(prettyBytes(1e16), "10 PB");
  assertEquals(prettyBytes(1e30), "1000000 YB");
});

Deno.test("supports negative number", () => {
  assertEquals(prettyBytes(-0.4), "-0.4 B");
  assertEquals(prettyBytes(-0.7), "-0.7 B");
  assertEquals(prettyBytes(-10.1), "-10.1 B");
  assertEquals(prettyBytes(-999), "-999 B");
  assertEquals(prettyBytes(-1001), "-1 kB");
});

Deno.test("locale option", () => {
  assertEquals(prettyBytes(-0.4, { locale: "de" }), "-0,4 B");
  assertEquals(prettyBytes(0.4, { locale: "de" }), "0,4 B");
  assertEquals(prettyBytes(1001, { locale: "de" }), "1 kB");
  assertEquals(prettyBytes(10.1, { locale: "de" }), "10,1 B");
  assertEquals(prettyBytes(1e30, { locale: "de" }), "1.000.000 YB");

  assertEquals(prettyBytes(-0.4, { locale: "en" }), "-0.4 B");
  assertEquals(prettyBytes(0.4, { locale: "en" }), "0.4 B");
  assertEquals(prettyBytes(1001, { locale: "en" }), "1 kB");
  assertEquals(prettyBytes(10.1, { locale: "en" }), "10.1 B");
  assertEquals(prettyBytes(1e30, { locale: "en" }), "1,000,000 YB");

  assertEquals(
    prettyBytes(-0.4, { locale: ["unknown", "de", "en"] }),
    "-0,4 B",
  );
  assertEquals(prettyBytes(0.4, { locale: ["unknown", "de", "en"] }), "0,4 B");
  assertEquals(prettyBytes(1001, { locale: ["unknown", "de", "en"] }), "1 kB");
  assertEquals(
    prettyBytes(10.1, { locale: ["unknown", "de", "en"] }),
    "10,1 B",
  );
  assertEquals(
    prettyBytes(1e30, { locale: ["unknown", "de", "en"] }),
    "1.000.000 YB",
  );

  assertEquals(prettyBytes(-0.4, { locale: true }), "-0.4 B");
  assertEquals(prettyBytes(0.4, { locale: true }), "0.4 B");
  assertEquals(prettyBytes(1001, { locale: true }), "1 kB");
  assertEquals(prettyBytes(10.1, { locale: true }), "10.1 B");
  assertEquals(prettyBytes(1e30, { locale: true }), "1,000,000 YB");

  assertEquals(prettyBytes(-0.4, { locale: false }), "-0.4 B");
  assertEquals(prettyBytes(0.4, { locale: false }), "0.4 B");
  assertEquals(prettyBytes(1001, { locale: false }), "1 kB");
  assertEquals(prettyBytes(10.1, { locale: false }), "10.1 B");
  assertEquals(prettyBytes(1e30, { locale: false }), "1000000 YB");

  assertEquals(prettyBytes(-0.4, { locale: undefined }), "-0.4 B");
  assertEquals(prettyBytes(0.4, { locale: undefined }), "0.4 B");
  assertEquals(prettyBytes(1001, { locale: undefined }), "1 kB");
  assertEquals(prettyBytes(10.1, { locale: undefined }), "10.1 B");
  assertEquals(prettyBytes(1e30, { locale: undefined }), "1000000 YB");
});

Deno.test("signed option", () => {
  assertEquals(prettyBytes(42, { signed: true }), "+42 B");
  assertEquals(prettyBytes(-13, { signed: true }), "-13 B");
  assertEquals(prettyBytes(0, { signed: true }), " 0 B");
});

Deno.test("bits option", () => {
  assertEquals(prettyBytes(0, { bits: true }), "0 b");
  assertEquals(prettyBytes(0.4, { bits: true }), "0.4 b");
  assertEquals(prettyBytes(0.7, { bits: true }), "0.7 b");
  assertEquals(prettyBytes(10, { bits: true }), "10 b");
  assertEquals(prettyBytes(10.1, { bits: true }), "10.1 b");
  assertEquals(prettyBytes(999, { bits: true }), "999 b");
  assertEquals(prettyBytes(1001, { bits: true }), "1 kbit");
  assertEquals(prettyBytes(1001, { bits: true }), "1 kbit");
  assertEquals(prettyBytes(1e16, { bits: true }), "10 Pbit");
  assertEquals(prettyBytes(1e30, { bits: true }), "1000000 Ybit");
});

Deno.test("binary option", () => {
  assertEquals(prettyBytes(0, { binary: true }), "0 B");
  assertEquals(prettyBytes(4, { binary: true }), "4 B");
  assertEquals(prettyBytes(10, { binary: true }), "10 B");
  assertEquals(prettyBytes(10.1, { binary: true }), "10.1 B");
  assertEquals(prettyBytes(999, { binary: true }), "999 B");
  assertEquals(prettyBytes(1025, { binary: true }), "1 kiB");
  assertEquals(prettyBytes(1001, { binary: true }), "1000 B");
  assertEquals(prettyBytes(1e16, { binary: true }), "8.88 PiB");
  assertEquals(prettyBytes(1e30, { binary: true }), "827000 YiB");
});

Deno.test("bits and binary option", () => {
  assertEquals(prettyBytes(0, { bits: true, binary: true }), "0 b");
  assertEquals(prettyBytes(4, { bits: true, binary: true }), "4 b");
  assertEquals(prettyBytes(10, { bits: true, binary: true }), "10 b");
  assertEquals(prettyBytes(999, { bits: true, binary: true }), "999 b");
  assertEquals(prettyBytes(1025, { bits: true, binary: true }), "1 kibit");
  assertEquals(prettyBytes(1e6, { bits: true, binary: true }), "977 kibit");
});

Deno.test("fractional digits options", () => {
  assertEquals(prettyBytes(1900, { maximumFractionDigits: 1 }), "1.9 kB");
  assertEquals(prettyBytes(1900, { minimumFractionDigits: 3 }), "1.900 kB");
  assertEquals(prettyBytes(1911, { maximumFractionDigits: 1 }), "1.9 kB");
  assertEquals(prettyBytes(1111, { maximumFractionDigits: 2 }), "1.11 kB");
  assertEquals(prettyBytes(1019, { maximumFractionDigits: 3 }), "1.019 kB");
  assertEquals(prettyBytes(1001, { maximumFractionDigits: 3 }), "1.001 kB");
  assertEquals(
    prettyBytes(1000, { minimumFractionDigits: 1, maximumFractionDigits: 3 }),
    "1.0 kB",
  );
  assertEquals(
    prettyBytes(3942, { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
    "3.94 kB",
  );
  assertEquals(
    prettyBytes(4001, { maximumFractionDigits: 3, binary: true }),
    "3.907 kiB",
  );
  assertEquals(
    prettyBytes(18717, { maximumFractionDigits: 2, binary: true }),
    "18.28 kiB",
  );
  assertEquals(
    prettyBytes(18717, { maximumFractionDigits: 4, binary: true }),
    "18.2783 kiB",
  );
  assertEquals(
    prettyBytes(32768, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
      binary: true,
    }),
    "32.00 kiB",
  );
  assertEquals(
    prettyBytes(65536, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 3,
      binary: true,
    }),
    "64.0 kiB",
  );
});
