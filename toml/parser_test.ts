// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { parseFile } from "./parser.ts";
import * as path from "../fs/path/mod.ts";
const testFilesDir = path.resolve("toml", "test");

test(function tomlParseCRLF() {
  const expected = { boolean: { bool1: true, bool2: false } };
  const actual = parseFile(path.join(testFilesDir, "CRLF.toml"));
  assertEquals(actual, expected);
});

test(function tomlParseboolean() {
  const expected = { boolean: { bool1: true, bool2: false } };
  const actual = parseFile(path.join(testFilesDir, "boolean.toml"));
  assertEquals(actual, expected);
});

test(function tomlParseInteger() {
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
});

test(function tomlParseFloat() {
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
});

test(function tomlParseArrays() {
  const expected = {
    arrays: {
      data: [["gamma", "delta"], [1, 2]],
      hosts: ["alpha", "omega"]
    }
  };
  const actual = parseFile(path.join(testFilesDir, "arrays.toml"));
  assertEquals(actual, expected);
});

test(function tomlParseTable() {
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
});

test(function tomlParseSimple() {
  const expected = {
    deno: "is",
    not: "[node]",
    regex: "<ic*s*>"
  };
  const actual = parseFile(path.join(testFilesDir, "simple.toml"));
  assertEquals(actual, expected);
});

test(function tomlParseDatetime() {
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
});

test(function tomlParseInlineTable() {
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
});
