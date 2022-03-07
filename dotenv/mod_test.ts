// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { parse, verify } from "./mod.ts";
import * as path from "../path/mod.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("parse", async (t) => {
  const dotEnvTestSource = Deno.readTextFileSync(
    path.join(
      testdataDir,
      ".env.parse.test",
    ),
  );
  const { env, exports } = parse(dotEnvTestSource);

  await t.step("skip comments", () => assertEquals(env["#COMMENT"], undefined));
  await t.step("empty value", () => assertEquals(env.EMPTY_VALUE, ""));

  await t.step("basic variable", () => assertEquals(env.BASIC, "basic"));
  await t.step(
    "skip empty lines",
    () => assertEquals(env.AFTER_EMPTY, "empty"),
  );
  await t.step(
    "escape single quotes",
    () => assertEquals(env.QUOTED_SINGLE, "single quoted"),
  );
  await t.step(
    "escape double quotes",
    () => assertEquals(env.QUOTED_DOUBLE, "double quoted"),
  );
  await t.step(
    "expand newlines in double quotes",
    () => assertEquals(env.MULTILINE, "hello\nworld"),
  );
  await t.step(
    "maintain inner quotes",
    () => assertEquals(JSON.parse(env.JSON).foo, "bar"),
  );

  await t.step(
    "preserve whitespace in single-quoted value",
    () => assertEquals(env.WHITESPACE, "    whitespace   "),
  );

  await t.step(
    "preserve whitespace in double-quoted value",
    () => assertEquals(env.WHITESPACE_DOUBLE, "    whitespace   "),
  );

  await t.step(
    "escape newlines in single quotes",
    () => assertEquals(env.MULTILINE_SINGLE_QUOTE, "hello\\nworld"),
  );

  await t.step(
    "accept value with non-word-characters",
    () => assertEquals(env.EQUALS, "equ==als"),
  );

  await t.step(
    "preserve whitespaces in value",
    () => assertEquals(env.VAR_WITH_SPACE, "var with space"),
  );
  await t.step(
    "trim whitespaces around value",
    () => assertEquals(env.VAR_WITH_ENDING_WHITESPACE, "value"),
  );
  await t.step(
    "key containing number",
    () => assertEquals(env.V4R_W1TH_NUM8ER5, "var with numbers"),
  );
  await t.step(
    "key starting with number",
    () => assertEquals(env["1INVALID"], undefined),
  );
  await t.step(
    "indented variables with spaces",
    () => assertEquals(env.INDENTED_VAR, "indented var"),
  );
  await t.step(
    "indented variables with tabs",
    () => assertEquals(env.TAB_INDENTED_VAR, "indented var"),
  );

  await t.step(
    "exports",
    () =>
      assertEquals(exports, [
        "EXPORTED_VAR",
        "INDENTED_EXPORTED_ASSIGNMENT",
        "TAB_INDENTED_EXPORTED_ASSIGNMENT",
        "TAB_SPACED_ASSIGNMENT_VAR",
      ]),
  );

  await t.step(
    "export values",
    () => {
      const values = Object.entries(env)
        .filter(([key]) => exports.includes(key))
        .map(([_key, value]) => value);
      assertEquals(values, [
        "exported value 1",
        "exported value 2",
        "  exported value 3  ",
        "		exported value 4		",
      ]);
    },
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
