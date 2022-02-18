// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { parse, verify } from "./mod.ts";

Deno.test("parse", () => {
  const dotEnvTestSource = Deno.readTextFileSync("./testdata/.env.parse.test");
  const { env, exports } = parse(dotEnvTestSource);
  assertEquals(env.BASIC, "basic", "parses a basic variable");
  assertEquals(env.AFTER_EMPTY, "empty", "skips empty lines");
  assertEquals(env["#COMMENT"], undefined, "skips lines with comments");
  assertEquals(env.EMPTY_VALUE, "", "empty values are empty strings");

  assertEquals(
    env.QUOTED_SINGLE,
    "single quoted",
    "single quotes are escaped",
  );

  assertEquals(
    env.QUOTED_DOUBLE,
    "double quoted",
    "double quotes are escaped",
  );

  assertEquals(
    env.MULTILINE,
    "hello\nworld",
    "new lines are expanded in double quotes",
  );

  assertEquals(
    JSON.parse(env.JSON).foo,
    "bar",
    "inner quotes are maintained",
  );

  assertEquals(
    env.WHITESPACE,
    "    whitespace   ",
    "whitespace in single-quoted values is preserved",
  );

  assertEquals(
    env.WHITESPACE_DOUBLE,
    "    whitespace   ",
    "whitespace in double-quoted values is preserved",
  );

  assertEquals(
    env.MULTILINE_SINGLE_QUOTE,
    "hello\\nworld",
    "new lines are escaped in single quotes",
  );

  assertEquals(env.EQUALS, "equ==als", "handles equals inside string");

  assertEquals(
    env.VAR_WITH_SPACE,
    "var with space",
    "variables defined with spaces are parsed",
  );

  assertEquals(
    env.VAR_WITH_ENDING_WHITESPACE,
    "value",
    "variables defined with ending whitespace are trimmed",
  );

  assertEquals(
    env.V4R_W1TH_NUM8ER5,
    "var with numbers",
    "accepts variables containing number",
  );

  assertEquals(
    env["1INVALID"],
    undefined,
    "variables beginning with a number are not parsed",
  );

  assertEquals(
    env.INDENTED_VAR,
    "indented var",
    "accepts variables that are indented with space",
  );

  assertEquals(
    env.INDENTED_VALUE,
    "indented value",
    "accepts values that are indented with space",
  );

  assertEquals(
    env.TAB_INDENTED_VAR,
    "indented var",
    "accepts variables that are indented with tabs",
  );

  assertEquals(
    env.TAB_INDENTED_VALUE,
    "indented value",
    "accepts values that are indented with tabs",
  );

  assertEquals(exports, [
    "EXPORTED_VAR",
    "INDENTED_EXPORTED_ASSIGNMENT",
    "TAB_INDENTED_EXPORTED_ASSIGNMENT",
    "TAB_SPACED_ASSIGNMENT_VAR",
  ]);

  const values = Object.entries(env)
    .filter(([key]) => exports.includes(key))
    .map(([_, value]) => value);

  assertEquals(
    values,
    [
      "exported value 1",
      "exported value 2",
      "  exported value 3  ",
      "		exported value 4		",
    ],
  );
});

Deno.test("verify allowEmptyValues", () => {
  const dotEnv = { env: { foo: "" }, exports: [] };
  assertEquals(verify(dotEnv, { allowEmptyValues: true }), true);
  assertEquals(verify(dotEnv, { allowEmptyValues: false }), true);
});

Deno.test("verify allowEmptyValues example", () => {
  const dotEnv = { env: { foo: "" }, exports: [] };
  const example = { env: { foo: "var" }, exports: [] };
  assertEquals(verify(dotEnv, { allowEmptyValues: true, example }), true);
});

Deno.test("verify allowEmptyValues throw", () => {
  const dotEnv = { env: { foo: "" }, exports: [] };
  const example = { env: { foo: "bar" }, exports: [] };
  assertThrows(() => verify(dotEnv, { allowEmptyValues: false, example }));
});
