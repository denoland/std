// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { EnvObject, loadSync, parse, stringify, verify } from "./mod.ts";
import * as path from "../path/mod.ts";

function clearDenoEnv() {
  Object.keys(Deno.env.toObject()).forEach((key) => Deno.env.delete(key));
}

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("parse", async (t) => {
  await t.step(
    "basic",
    () => {
      const { env } = parse(`BASIC=basic`);
      assertEquals(env["BASIC"], "basic");
    },
  );
  await t.step(
    "comment",
    () => {
      const { env } = parse(`#COMMENT=comment`);
      assertEquals(env["#COMMENT"], undefined);
    },
  );
  await t.step(
    "empty",
    () => {
      const { env } = parse(`EMPTY=`);
      assertEquals(env["EMPTY"], "");
    },
  );
  await t.step(
    "inner quotes",
    () => {
      const { env } = parse(`JSON={"foo": "bar"}`);
      assertEquals(env["JSON"], '{"foo": "bar"}');
    },
  );
  await t.step(
    "unquoted whitespace trim",
    () => {
      const { env } = parse(`FOO= some value`);
      assertEquals(env["FOO"], "some value");
    },
  );
  await t.step(
    "single quote escape",
    () => {
      const { env } = parse(`SINGLE_QUOTE='quoted'`);
      assertEquals(env["SINGLE_QUOTE"], "quoted");
    },
  );
  await t.step(
    "double quote escape",
    () => {
      const { env } = parse(`DOUBLE_QUOTE="quoted"`);
      assertEquals(env["DOUBLE_QUOTE"], "quoted");
    },
  );
  await t.step(
    "single quote maintain whitespace",
    () => {
      const { env } = parse(`FOO=' some value '`);
      assertEquals(env["FOO"], " some value ");
    },
  );
  await t.step(
    "double quote maintain whitespace",
    () => {
      const { env } = parse(`FOO=" some value "`);
      assertEquals(env["FOO"], " some value ");
    },
  );
  await t.step(
    "double quote multiline",
    () => {
      const { env } = parse(`MULTILINE="new\\nline"`);
      assertEquals(env["MULTILINE"], "new\nline");
    },
  );
  await t.step(
    "backticks",
    () => {
      const { env } = parse(
        `BACKTICK_KEY=\`This has 'single' and "double" quotes inside of it.\``,
      );
      assertEquals(
        env["BACKTICK_KEY"],
        `This has 'single' and "double" quotes inside of it.`,
      );
    },
  );

  await t.step(
    "non-word-characters",
    () => {
      const { env } = parse(
        `EQUALS=equ==als`,
      );
      assertEquals(
        env["EQUALS"],
        "equ==als",
      );
    },
  );

  await t.step(
    "key starting with number",
    () => {
      const { env } = parse(
        `1INVALID=invalid`,
      );
      assertEquals(
        env["1INVALID"],
        undefined,
      );
    },
  );

  await t.step(
    "export",
    () => {
      const { env } = parse(`export BASIC=basic`);
      assertEquals(env["BASIC"], "basic");
    },
  );
});
Deno.test("stringify", async (t) => {
  await t.step(
    "basic",
    () =>
      assertEquals(
        stringify({ env: { "BASIC": "basic" }, exports: [] }),
        `BASIC=basic`,
      ),
  );
  await t.step(
    "comment",
    () =>
      assertEquals(
        stringify({ env: { "#COMMENT": "comment" }, exports: [] }),
        `#COMMENT=comment`,
      ),
  );
  await t.step(
    "single quote",
    () =>
      assertEquals(
        stringify({ env: { "QUOTED_SINGLE": "single quoted" }, exports: [] }),
        `QUOTED_SINGLE='single quoted'`,
      ),
  );
  await t.step(
    "multiline",
    () =>
      assertEquals(
        stringify({ env: { "MULTILINE": "hello\nworld" }, exports: [] }),
        `MULTILINE="hello\\nworld"`,
      ),
  );
  await t.step(
    "whitespace",
    () =>
      assertEquals(
        stringify({ env: { "WHITESPACE": "    whitespace   " }, exports: [] }),
        `WHITESPACE='    whitespace   '`,
      ),
  );
  await t.step(
    "equals",
    () =>
      assertEquals(
        stringify({ env: { "EQUALS": "equ==als" }, exports: [] }),
        `EQUALS='equ==als'`,
      ),
  );
  await t.step(
    "number",
    () =>
      assertEquals(
        stringify({ env: { "THE_ANSWER": "42" }, exports: [] }),
        `THE_ANSWER=42`,
      ),
  );
  await t.step(
    "undefined",
    () =>
      assertEquals(
        stringify({
          env: { "UNDEFINED": undefined } as unknown as Record<string, string>,
          exports: [],
        }),
        `UNDEFINED=`,
      ),
  );
  await t.step(
    "null",
    () =>
      assertEquals(
        stringify({
          env: { "NULL": null } as unknown as Record<string, string>,
          exports: [],
        }),
        `NULL=`,
      ),
  );
  await t.step(
    "export",
    () =>
      assertEquals(
        stringify({
          env: {
            "EXPORT": "exported",
          },
          exports: ["EXPORT"],
        }),
        `export EXPORT=exported`,
      ),
  );
});
Deno.test("loadSync", () => {
  loadSync(Deno.env, {
    envPath: path.join(testdataDir, ".env.test"),
    examplePath: path.join(testdataDir, ".env.example.test"),
    defaultsPath: path.join(testdataDir, ".env.defaults.test"),
  });
  assertEquals(Deno.env.get("GREETING"), "Hello World");
  assertEquals(Deno.env.get("DEFAULT"), "Some Default");
  clearDenoEnv();
});

Deno.test("verify allowEmptyValues", () => {
  const dotEnv: EnvObject = { env: { foo: "" }, exports: [] };
  assertEquals(verify(dotEnv, { allowEmptyValues: true }), true);
  assertEquals(verify(dotEnv, { allowEmptyValues: false }), true);
});
Deno.test("verify allowEmptyValues example", () => {
  const dotEnv: EnvObject = { env: { foo: "" }, exports: [] };
  const example: EnvObject = { env: { foo: "var" }, exports: [] };
  assertEquals(verify(dotEnv, { allowEmptyValues: true, example }), true);
});
Deno.test("verify allowEmptyValues throw", () => {
  const dotEnv: EnvObject = { env: { foo: "" }, exports: [] };
  const example: EnvObject = { env: { foo: "bar" }, exports: [] };
  assertThrows(() => verify(dotEnv, { allowEmptyValues: false, example }));
});
