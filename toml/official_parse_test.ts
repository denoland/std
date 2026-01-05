// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "../assert/mod.ts";
import { convertTestCase, type TestCase } from "./_test_utils.ts";
import { parse } from "./parse.ts";

const testCases = await Deno.readTextFile(
  new URL("./testdata/files-toml-1.0.0", import.meta.url),
);

const ignored = [
  // JavaScript Number cannot represent long integers correctly
  "valid/integer/long",
  // Lacking implemention
  "invalid/array/extending-table",
  "invalid/array/tables-01",
  "invalid/control/comment-",
  "invalid/control/multi-",
  "invalid/control/rawmulti-",
  "invalid/control/rawstring-",
  "invalid/control/string-",
  "invalid/datetime/hour-over",
  "invalid/datetime/no-secs",
  "invalid/datetime/offset-minus-no-hour-minute-sep",
  "invalid/datetime/offset-overflow-hour",
  "invalid/datetime/offset-plus-no-hour-minute-sep",
  "invalid/encoding/bad-codepoint",
  "invalid/encoding/bad-utf8-in-comment",
  "invalid/encoding/bad-utf8-in-multiline",
  "invalid/encoding/bad-utf8-in-multiline-literal",
  "invalid/encoding/bad-utf8-in-string",
  "invalid/encoding/bad-utf8-in-string-literal",
  "invalid/inline-table/duplicate-key-",
  "invalid/inline-table/overwrite-01",
  "invalid/inline-table/overwrite-02",
  "invalid/inline-table/overwrite-03",
  "invalid/inline-table/overwrite-06",
  "invalid/inline-table/overwrite-07",
  "invalid/inline-table/overwrite-08",
  "invalid/inline-table/overwrite-10",
  "invalid/integer/capital-hex",
  "invalid/key/after-",
  "invalid/key/dotted-redefine-table-",
  "invalid/key/duplicate-keys-",
  "invalid/key/no-eol-01",
  "invalid/key/no-eol-03",
  "invalid/key/no-eol-04",
  "invalid/local-datetime/hour-over",
  "invalid/local-datetime/no-secs",
  "invalid/local-time/hour-over",
  "invalid/local-time/minute-over",
  "invalid/local-time/second-over",
  "invalid/spec-1.0.0/inline-table-",
  "invalid/string/bad-uni-esc-03",
  "invalid/string/bad-uni-esc-06",
  "invalid/string/bad-uni-esc-07",
  "invalid/string/bad-uni-esc-3",
  "invalid/string/bad-uni-esc-6",
  "invalid/string/bad-uni-esc-7",
  "invalid/string/bad-uni-esc-ml-3",
  "invalid/string/bad-uni-esc-ml-6",
  "invalid/string/bad-uni-esc-ml-7",
  "invalid/string/basic-multiline-out-of-range-unicode-escape-02",
  "invalid/string/basic-out-of-range-unicode-escape-02",
  "invalid/table/append-with-dotted-keys-05",
  "invalid/table/append-with-dotted-keys-06",
  "invalid/table/append-with-dotted-keys-07",
  "valid/array/open-parent-table",
  "valid/comment/tricky",
  "valid/datetime/datetime",
  "valid/datetime/edge",
  "valid/implicit-and-explicit-after",
  "valid/inline-table/array-02",
  "valid/inline-table/array-03",
  "valid/key/quoted-unicode",
  "valid/spec-1.0.0/table-4",
  "valid/string/ends-in-whitespace-escape",
  "valid/string/multibyte-escape",
  "valid/string/multiline",
  "valid/string/multiline-empty",
  "valid/string/multiline-quotes",
  "valid/string/quoted-unicode",
  "valid/string/raw-multiline",
  "valid/string/unicode-escape",
  "valid/table/array-empty-name",
  "valid/table/array-implicit-and-explicit-after",
  "valid/table/empty-name",
  "valid/table/without-super",
  "valid/table/without-super-with-values",
];

function isIgnored(testCase: string): boolean {
  return ignored.some((ignoredCase) =>
    ignoredCase.endsWith("-")
      ? testCase.startsWith(ignoredCase)
      : testCase === ignoredCase
  );
}

for (
  const testCase of testCases.split("\n")
    .filter((line) => line.endsWith(".toml"))
    .map((line) => line.slice(0, -5))
) {
  const input = await Deno.readTextFile(
    new URL(`./testdata/${testCase}.toml`, import.meta.url),
  );

  if (testCase.startsWith("invalid/")) {
    Deno.test({
      name: `[toml] parse ${testCase}`,
      ignore: isIgnored(testCase),
      fn() {
        assertThrows(() => parse(input), `TOML input:\n${input}`);
      },
    });
  } else {
    const json: Record<string, TestCase> = JSON.parse(
      await Deno.readTextFile(
        new URL(`./testdata/${testCase}.json`, import.meta.url),
      ),
    );
    const expected: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(json)) {
      expected[key] = convertTestCase(value);
    }

    Deno.test({
      name: `[toml] parse ${testCase}`,
      ignore: isIgnored(testCase),
      fn() {
        const parsed = parse(input);
        assertEquals(parsed, expected);
      },
    });
  }
}
