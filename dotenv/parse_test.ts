// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { parse } from "./parse.ts";
import * as path from "@std/path";
import { assertSpyCall, spy } from "@std/testing/mock";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("parse()", () => {
  using consoleWarnSpy = spy(console, "warn");

  const testDotenv = Deno.readTextFileSync(
    path.join(testdataDir, "./.env.test"),
  );

  const load = parse(testDotenv);
  assertEquals(Object.keys(load).length, 26, "parses 26 keys");
  assertEquals(load.BASIC, "basic", "parses a basic variable");
  assertEquals(load.AFTER_EMPTY, "empty", "skips empty lines");
  assertEquals(load["#COMMENT"], undefined, "skips lines with comments");
  assertEquals(load.EMPTY_VALUE, "", "empty values are empty strings");

  assertEquals(
    load.QUOTED_SINGLE,
    "single quoted",
    "single quotes are escaped",
  );

  assertEquals(
    load.QUOTED_DOUBLE,
    "double quoted",
    "double quotes are escaped",
  );

  assertEquals(
    load.EMPTY_SINGLE,
    "",
    "handles empty single quotes",
  );

  assertEquals(
    load.EMPTY_DOUBLE,
    "",
    "handles empty double quotes",
  );

  assertEquals(
    load.MULTILINE1,
    "hello\nworld",
    "new lines are expanded in double quotes",
  );
  assertEquals(
    load.MULTILINE2,
    "hello\r\nworld",
    "new lines are expanded in double quotes",
  );

  assertEquals(
    JSON.parse(load.JSON || JSON.stringify({})).foo,
    "bar",
    "inner quotes are maintained",
  );

  assertEquals(
    load.WHITESPACE,
    "    whitespace   ",
    "whitespace in single-quoted values is preserved",
  );

  assertEquals(
    load.WHITESPACE_DOUBLE,
    "    whitespace   ",
    "whitespace in double-quoted values is preserved",
  );

  assertEquals(
    load.MULTILINE_SINGLE_QUOTE1,
    "hello\\nworld",
    "new lines are escaped in single quotes",
  );
  assertEquals(
    load.MULTILINE_SINGLE_QUOTE2,
    "hello\\r\\nworld",
    "new lines are escaped in single quotes",
  );

  assertEquals(load.EQUALS, "equ==als", "handles equals inside string");

  assertEquals(
    load.VAR_WITH_SPACE,
    "var with space",
    "variables defined with spaces are parsed",
  );

  assertEquals(
    load.VAR_WITH_ENDING_WHITESPACE,
    "value",
    "variables defined with ending whitespace are trimmed",
  );

  assertEquals(
    load.V4R_W1TH_NUM8ER5,
    "var with numbers",
    "accepts variables containing number",
  );

  assertEquals(
    load["1INVALID"],
    undefined,
    "variables beginning with a number are not parsed",
  );

  assertEquals(
    load.INDENTED_VAR,
    "indented var",
    "accepts variables that are indented with space",
  );

  assertEquals(
    load.INDENTED_VALUE,
    "indented value",
    "accepts values that are indented with space",
  );

  assertEquals(
    load.TAB_INDENTED_VAR,
    "indented var",
    "accepts variables that are indented with tabs",
  );

  assertEquals(
    load.TAB_INDENTED_VALUE,
    "indented value",
    "accepts values that are indented with tabs",
  );

  assertEquals(
    load.PRIVATE_KEY_SINGLE_QUOTED,
    "-----BEGIN RSA PRIVATE KEY-----\n...\nHkVN9...\n...\n-----END DSA PRIVATE KEY-----",
    "Private Key Single Quoted",
  );

  assertEquals(
    load.PRIVATE_KEY_DOUBLE_QUOTED,
    "-----BEGIN RSA PRIVATE KEY-----\n...\nHkVN9...\n...\n-----END DSA PRIVATE KEY-----",
    "Private Key Double Quoted",
  );

  assertEquals(
    load.EXPORT_IS_IGNORED,
    "export is ignored",
    "export at the start of the key is ignored",
  );

  assertSpyCall(consoleWarnSpy, 0, {
    args: [
      'Ignored the key "1INVALID" as it is not a valid identifier: The key need to match the pattern /^[a-zA-Z_][a-zA-Z0-9_]*$/.',
    ],
  });
});

Deno.test("parse() ignores comments", () => {
  const testDotenv = Deno.readTextFileSync(
    path.join(testdataDir, "./.env.comments"),
  );

  const load = parse(testDotenv);
  assertEquals(load.FOO, "bar", "unquoted value with a simple comment");
  assertEquals(
    load.GREETING,
    "hello world",
    "double quoted value with a simple comment",
  );
  assertEquals(
    load.SPECIAL_CHARACTERS_UNQUOTED,
    "123",
    "unquoted value with special characters in comment",
  );
  assertEquals(
    load.SPECIAL_CHARACTERS_UNQUOTED_NO_SPACES,
    "123",
    "unquoted value with special characters in comment which is right after value",
  );
});

Deno.test("parse() expands variables", () => {
  const testDotenv = Deno.readTextFileSync(
    path.join(testdataDir, "./.env.expand.test"),
  );

  const load = parse(testDotenv);
  assertEquals(
    load.EXPAND_ESCAPED,
    "\\$THE_ANSWER",
    "variable is escaped not expanded",
  );
  assertEquals(load.EXPAND_VAR, "42", "variable is expanded");
  assertEquals(
    load.EXPAND_TWO_VARS,
    "single quoted!==double quoted",
    "two variables are expanded",
  );
  assertEquals(
    load.EXPAND_RECURSIVE,
    "single quoted!==double quoted",
    "recursive variables expanded",
  );
  assertEquals(load.EXPAND_DEFAULT_TRUE, "default", "default expanded");
  assertEquals(load.EXPAND_DEFAULT_FALSE, "42", "default not expanded");
  assertEquals(load.EXPAND_DEFAULT_VAR, "42", "default var expanded");
  assertEquals(
    load.EXPAND_DEFAULT_VAR_RECURSIVE,
    "single quoted!==double quoted",
    "default recursive var expanded",
  );
  assertEquals(
    load.EXPAND_DEFAULT_VAR_DEFAULT,
    "default",
    "default variable's default value is used",
  );
  assertEquals(
    load.EXPAND_DEFAULT_WITH_SPECIAL_CHARACTERS,
    "/default/path",
    "default with special characters expanded",
  );
  assertEquals(
    load.EXPAND_VAR_IN_BRACKETS,
    "42",
    "variable in brackets is expanded",
  );
  assertEquals(
    load.EXPAND_TWO_VARS_IN_BRACKETS,
    "single quoted!==double quoted",
    "two variables in brackets are expanded",
  );
  assertEquals(
    load.EXPAND_RECURSIVE_VAR_IN_BRACKETS,
    "single quoted!==double quoted",
    "recursive variables in brackets expanded",
  );
  assertEquals(
    load.EXPAND_DEFAULT_IN_BRACKETS_TRUE,
    "default",
    "default in brackets expanded",
  );
  assertEquals(
    load.EXPAND_DEFAULT_IN_BRACKETS_FALSE,
    "42",
    "default in brackets not expanded",
  );
  assertEquals(
    load.EXPAND_DEFAULT_VAR_IN_BRACKETS,
    "42",
    "default var in brackets expanded",
  );
  assertEquals(
    load.EXPAND_DEFAULT_VAR_IN_BRACKETS_RECURSIVE,
    "single quoted!==double quoted",
    "default recursive var in brackets expanded",
  );
  assertEquals(
    load.EXPAND_DEFAULT_VAR_IN_BRACKETS_DEFAULT,
    "default",
    "default variable's default value in brackets is used",
  );
  assertEquals(
    load.EXPAND_DEFAULT_IN_BRACKETS_WITH_SPECIAL_CHARACTERS,
    "/default/path",
    "default in brackets with special characters expanded",
  );
  assertEquals(
    load.EXPAND_WITH_DIFFERENT_STYLES,
    "single quoted!==double quoted",
    "variables within and without brackets expanded",
  );
});

Deno.test("parse() result is not affected by extended Object.prototype", () => {
  // deno-lint-ignore no-explicit-any
  (Object.prototype as any).foo = 1;
  const result = parse("bar=1");
  assertEquals(result.foo, undefined);
  assertEquals(result.bar, "1");
});
