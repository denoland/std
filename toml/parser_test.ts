// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { parseFile } from "./parser.ts";
import * as path from "../fs/path/mod.ts";
const testFilesDir = path.resolve("toml", "testdata");

test({
  name: "[TOML] Strings",
  fn() {
    const expected = {
      strings: {
        str0: "deno",
        str1: "Roses are not Deno\nViolets are not Deno either",
        str2: "Roses are not Deno\nViolets are not Deno either",
        str3: "Roses are not Deno\r\nViolets are not Deno either",
        str4: "this is a \"quote\"",
        str5: "The quick brown\nfox jumps over\nthe lazy dog.",
        str6: "The quick brown\nfox jumps over\nthe lazy dog.",
        lines: "The first newline is\ntrimmed in raw strings.\n   All other whitespace\n   is preserved."
      }
    };
    const actual = parseFile(path.join(testFilesDir, "string.toml"));
    assertEquals(actual, expected);
  }
});

test({
  name: "[TOML] CRLF",
  fn() {
    const expected = { boolean: { bool1: true, bool2: false } };
    const actual = parseFile(path.join(testFilesDir, "CRLF.toml"));
    assertEquals(actual, expected);
  }
});

test({
  name: "[TOML] Boolean",
  fn() {
    const expected = { boolean: { bool1: true, bool2: false } };
    const actual = parseFile(path.join(testFilesDir, "boolean.toml"));
    assertEquals(actual, expected);
  }
});

test({
  name: "[TOML] Integer",
  fn() {
    const expected = {
      integer: {
        int1: 99,
        int2: 42,
        int3: 0,
        int4: -17,
        int5: 1000,
        int6: 5349221,
        int7: 12345,
        hex1: "0xDEADBEEF",
        hex2: "0xdeadbeef",
        hex3: "0xdead_beef",
        oct1: "0o01234567",
        oct2: "0o755",
        bin1: "0b11010110"
      }
    };
    const actual = parseFile(path.join(testFilesDir, "integer.toml"));
    assertEquals(actual, expected);
  }
});

test({
  name: "[TOML] Float",
  fn() {
    const expected = {
      float: {
        flt1: 1.0,
        flt2: 3.1415,
        flt3: -0.01,
        flt4: 5e22,
        flt5: 1e6,
        flt6: -2e-2,
        flt7: 6.626e-34,
        flt8: 224_617.445_991_228,
        sf1: Infinity,
        sf2: Infinity,
        sf3: -Infinity,
        sf4: NaN,
        sf5: NaN,
        sf6: NaN
      }
    };
    const actual = parseFile(path.join(testFilesDir, "float.toml"));
    assertEquals(actual, expected);
  }
});

test({
  name: "[TOML] Arrays",
  fn() {
    const expected = {
      arrays: {
        data: [["gamma", "delta"], [1, 2]],
        hosts: ["alpha", "omega"]
      }
    };
    const actual = parseFile(path.join(testFilesDir, "arrays.toml"));
    assertEquals(actual, expected);
  }
});

test({
  name: "[TOML] Table",
  fn() {
    const expected = {
      deeply: {
        nested: {
          object: {
            in: {
              the: {
                toml: {
                  name: "Tom Preston-Werner"
                }
              }
            }
          }
        }
      },
      servers: {
        alpha: {
          ip: "10.0.0.1",
          dc: "eqdc10"
        },
        beta: {
          ip: "10.0.0.2",
          dc: "eqdc20"
        }
      }
    };
    const actual = parseFile(path.join(testFilesDir, "table.toml"));
    assertEquals(actual, expected);
  }
});

test({
  name: "[TOML] Simple",
  fn() {
    const expected = {
      deno: "is",
      not: "[node]",
      regex: "<ic*s*>",
      NANI: "何?!"
    };
    const actual = parseFile(path.join(testFilesDir, "simple.toml"));
    assertEquals(actual, expected);
  }
});

test({
  name: "[TOML] Datetime",
  fn() {
    const expected = {
      datetime: {
        odt1: new Date("1979-05-27T07:32:00Z"),
        odt2: new Date("1979-05-27T00:32:00-07:00"),
        odt3: new Date("1979-05-27T00:32:00.999999-07:00"),
        odt4: new Date("1979-05-27 07:32:00Z"),
        ld1: new Date("1979-05-27"),
        lt1: "07:32:00",
        lt2: "00:32:00.999999"
      }
    };
    const actual = parseFile(path.join(testFilesDir, "datetime.toml"));
    assertEquals(actual, expected);
  }
});

test({
  name: "[TOML] Inline Table",
  fn() {
    const expected = {
      inlinetable: {
        name: {
          first: "Tom",
          last: "Preston-Werner"
        },
        point: {
          x: 1,
          y: 2
        },
        animal: {
          type: {
            name: "pug"
          }
        }
      }
    };
    const actual = parseFile(path.join(testFilesDir, "inlineTable.toml"));
    assertEquals(actual, expected);
  }
});
