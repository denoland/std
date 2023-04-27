// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { regexEscape } from "./regex_escape.ts";
import {
  assertEquals,
  assertMatch,
  assertNotMatch,
} from "../testing/asserts.ts";

const ALL_ASCII =
  "\x00\x01\x02\x03\x04\x05\x06\x07\b\t\n\v\f\r\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7F";
const ALL_REGEX_FLAGS = "gimsuy";

Deno.test("regexEscape", async (t) => {
  await t.step("examples", async (t) => {
    await t.step("`.` matches literal `.`", () => {
      const re = new RegExp(`^${regexEscape(".")}$`, "u");

      assertEquals("^\\.$", re.source);
      assertMatch(".", re);
      assertNotMatch("a", re);
    });
    await t.step("`$` matches literal `$`", () => {
      const re = new RegExp(`^${regexEscape("$")}$`);

      assertMatch("$", re);
      assertNotMatch("", re);
    });
    await t.step("`*` matches literal `*`", () => {
      const re = new RegExp(`^${regexEscape("a*")}$`);

      assertMatch("a*", re);
      assertNotMatch("", re);
      assertNotMatch("aaa", re);
    });
    await t.step("escapes work correctly within character class", () => {
      const re = new RegExp(`^[${regexEscape(".$*+[](){}|\\<>")}]$`);

      assertMatch(".", re);
      assertMatch("$", re);
      assertMatch("*", re);
      assertMatch("+", re);
      assertMatch("[", re);
      assertMatch("]", re);
      assertMatch("(", re);
      assertMatch(")", re);
      assertMatch("{", re);
      assertMatch("}", re);
      assertMatch("|", re);
      assertMatch("\\", re);
      assertMatch("<", re);
      assertMatch(">", re);

      assertNotMatch("a", re);
    });
  });
  await t.step("all ASCII", async (t) => {
    await t.step("interpolates without erroring", async (t) => {
      await t.step("outside character class", () => {
        for (const char of ALL_ASCII) {
          for (const flag of ALL_REGEX_FLAGS) {
            new RegExp(regexEscape(char), flag);
          }
        }
      });
      await t.step("within character class", () => {
        for (const char of ALL_ASCII) {
          for (const flag of ALL_REGEX_FLAGS) {
            new RegExp(`[${regexEscape(char)}]`, flag);
          }
        }
      });
      await t.step("matches self", () => {
        for (const char of ALL_ASCII) {
          for (const flag of ALL_REGEX_FLAGS) {
            assertMatch(char, new RegExp(`^${regexEscape(char)}$`, flag));
          }
        }
      });
      await t.step("doesn't match any other chars", () => {
        for (const char of ALL_ASCII) {
          for (const flag of ALL_REGEX_FLAGS) {
            if (flag === "i") continue;

            for (const char2 of ALL_ASCII) {
              if (char2 === char) continue;

              assertNotMatch(char2, new RegExp(`^${regexEscape(char)}$`, flag));
            }
          }
        }
      });
    });
  });
});
