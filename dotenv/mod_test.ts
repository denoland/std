// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "../testing/asserts.ts";
import {
  load,
  loadSync,
  MissingEnvVarsError,
  parse,
  stringify,
} from "./mod.ts";
import * as path from "../path/mod.ts";
import type { IsExact } from "../testing/types.ts";
import { assertType } from "../testing/types.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

const testOptions = {
  envPath: path.join(testdataDir, "./.env"),
  defaultsPath: path.join(testdataDir, "./.env.defaults"),
};

Deno.test("parser", () => {
  const testDotenv = Deno.readTextFileSync(
    path.join(testdataDir, "./.env.test"),
  );

  const load = parse(testDotenv);
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
    load.MULTILINE,
    "hello\nworld",
    "new lines are expanded in double quotes",
  );

  assertEquals(
    JSON.parse(load.JSON).foo,
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
    load.MULTILINE_SINGLE_QUOTE,
    "hello\\nworld",
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
});

Deno.test("with comments", () => {
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

Deno.test("loadure", () => {
  let conf = loadSync(testOptions);

  assertEquals(conf.GREETING, "hello world", "fetches .env");

  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");

  conf = loadSync({ ...testOptions, export: true });
  assertEquals(
    Deno.env.get("GREETING"),
    "hello world",
    "exports variables to env when requested",
  );

  Deno.env.set("DO_NOT_OVERRIDE", "Hello there");
  conf = loadSync({ ...testOptions, export: true });
  assertEquals(
    Deno.env.get("DO_NOT_OVERRIDE"),
    "Hello there",
    "does not export .env value if environment variable is already set",
  );

  assertEquals(
    loadSync(
      {
        envPath: "./.some.non.existent.env",
        defaultsPath: "./.some.non.existent.env",
      },
    ),
    {},
    "returns empty object if file doesn't exist",
  );

  assertEquals(
    loadSync({
      envPath: "./.some.non.existent.env",
      defaultsPath: testOptions.defaultsPath,
    }),
    { DEFAULT1: "Some Default" },
    "returns with defaults if file doesn't exist",
  );
});

Deno.test("loadureSafe", () => {
  // Default
  let conf = loadSync({
    ...testOptions,
  });
  assertEquals(conf.GREETING, "hello world", "fetches .env");

  // Custom .env.example
  conf = loadSync({
    ...testOptions,
    examplePath: path.join(testdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts a path to fetch env example from",
  );

  // Custom .env and .env.example
  conf = loadSync({
    envPath: path.join(testdataDir, "./.env.safe.test"),

    examplePath: path.join(testdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts paths to fetch env and env example from",
  );

  let error: MissingEnvVarsError;

  // Throws if not all required vars are there
  error = assertThrows(() => {
    loadSync({
      envPath: path.join(testdataDir, "./.env.safe.test"),

      examplePath: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  assertEquals(error.missing, ["ANOTHER"]);

  // Throws if any of the required vars is empty
  error = assertThrows(() => {
    loadSync({
      envPath: path.join(testdataDir, "./.env.safe.empty.test"),

      examplePath: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  assertEquals(error.missing, ["ANOTHER"]);

  // Does not throw if required vars are provided by example
  loadSync({
    envPath: path.join(testdataDir, "./.env.safe.empty.test"),

    examplePath: path.join(testdataDir, "./.env.example3.test"),
    defaultsPath: path.join(moduleDir, "./.env.defaults"),
  });

  // Does not throw if any of the required vars is empty, *and* allowEmptyValues is present
  loadSync({
    envPath: path.join(testdataDir, "./.env.safe.empty.test"),

    examplePath: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });

  // Does not throw if any of the required vars passed externally
  Deno.env.set("ANOTHER", "VAR");
  loadSync({
    envPath: path.join(testdataDir, "./.env.safe.test"),

    examplePath: path.join(testdataDir, "./.env.example2.test"),
  });

  // Throws if any of the required vars passed externally is empty
  Deno.env.set("ANOTHER", "");
  assertThrows(() => {
    loadSync({
      envPath: path.join(testdataDir, "./.env.safe.test"),

      examplePath: path.join(testdataDir, "./.env.example2.test"),
    });
  });

  // Does not throw if any of the required vars passed externally is empty, *and* allowEmptyValues is present
  Deno.env.set("ANOTHER", "");
  loadSync({
    envPath: path.join(testdataDir, "./.env.safe.test"),

    examplePath: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });
});

Deno.test("loadure async", async () => {
  let conf = await load(testOptions);
  assertEquals(conf.GREETING, "hello world", "fetches .env");

  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");

  conf = await load({ envPath: path.join(testdataDir, "./.env.test") });
  assertEquals(conf.BASIC, "basic", "accepts a path to fetch env from");

  conf = await load({ ...testOptions, export: true });
  assertEquals(
    Deno.env.get("GREETING"),
    "hello world",
    "exports variables to env when requested",
  );

  Deno.env.set("DO_NOT_OVERRIDE", "Hello there");
  conf = await load({ ...testOptions, export: true });
  assertEquals(
    Deno.env.get("DO_NOT_OVERRIDE"),
    "Hello there",
    "does not export .env value if environment variable is already set",
  );

  assertEquals(
    await load(
      {
        envPath: "./.some.non.existent.env",
        defaultsPath: "./.some.non.existent.env",
      },
    ),
    {},
    "returns empty object if file doesn't exist",
  );

  assertEquals(
    await load({ ...testOptions, envPath: "./.some.non.existent.env" }),
    { DEFAULT1: "Some Default" },
    "returns with defaults if file doesn't exist",
  );
});

Deno.test("loadureSafe async", async () => {
  // Default
  let conf = await load({
    ...testOptions,
  });
  assertEquals(conf.GREETING, "hello world", "fetches .env");

  // Custom .env.example
  conf = await load({
    ...testOptions,
    examplePath: path.join(testdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts a path to fetch env example from",
  );

  // Custom .env and .env.example
  conf = await load({
    envPath: path.join(testdataDir, "./.env.safe.test"),

    examplePath: path.join(testdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts paths to fetch env and env example from",
  );

  let error: MissingEnvVarsError;

  // Throws if not all required vars are there
  error = await assertRejects(async () => {
    await load({
      envPath: path.join(testdataDir, "./.env.safe.test"),

      examplePath: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  assertEquals(error.missing, ["ANOTHER"]);

  // Throws if any of the required vars is empty
  error = await assertRejects(async () => {
    await load({
      envPath: path.join(testdataDir, "./.env.safe.empty.test"),

      examplePath: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  assertEquals(error.missing, ["ANOTHER"]);

  // Does not throw if required vars are provided by example
  await load({
    envPath: path.join(testdataDir, "./.env.safe.empty.test"),

    examplePath: path.join(testdataDir, "./.env.example3.test"),
    defaultsPath: path.join(moduleDir, "./.env.defaults"),
  });

  // Does not throw if any of the required vars is empty, *and* allowEmptyValues is present
  await load({
    envPath: path.join(testdataDir, "./.env.safe.empty.test"),

    examplePath: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });

  // Does not throw if any of the required vars passed externally
  Deno.env.set("ANOTHER", "VAR");
  await load({
    envPath: path.join(testdataDir, "./.env.safe.test"),

    examplePath: path.join(testdataDir, "./.env.example2.test"),
  });

  // Throws if any of the required vars passed externally is empty
  Deno.env.set("ANOTHER", "");
  assertRejects(async () => {
    await load({
      envPath: path.join(testdataDir, "./.env.safe.test"),

      examplePath: path.join(testdataDir, "./.env.example2.test"),
    });
  });

  // Does not throw if any of the required vars passed externally is empty, *and* allowEmptyValues is present
  Deno.env.set("ANOTHER", "");
  await load({
    envPath: path.join(testdataDir, "./.env.safe.test"),

    examplePath: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });
});

Deno.test("load defaults", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-read",
      "--allow-env",
      path.join(testdataDir, "./app_defaults.ts"),
    ],
    cwd: testdataDir,
  });
  const { stdout } = await command.output();

  const decoder = new TextDecoder();
  const conf = JSON.parse(decoder.decode(stdout).trim());

  assertEquals(conf.GREETING, "hello world", "fetches .env by default");

  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");
});

Deno.test("expand variables", () => {
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
Deno.test("stringify", async (t) => {
  await t.step(
    "basic",
    () =>
      assertEquals(
        stringify({ "BASIC": "basic" }),
        `BASIC=basic`,
      ),
  );
  await t.step(
    "comment",
    () =>
      assertEquals(
        stringify({ "#COMMENT": "comment" }),
        ``,
      ),
  );
  await t.step(
    "single quote",
    () =>
      assertEquals(
        stringify({ "QUOTED_SINGLE": "single quoted" }),
        `QUOTED_SINGLE='single quoted'`,
      ),
  );
  await t.step(
    "multiline",
    () =>
      assertEquals(
        stringify({ "MULTILINE": "hello\nworld" }),
        `MULTILINE="hello\\nworld"`,
      ),
  );
  await t.step(
    "whitespace",
    () =>
      assertEquals(
        stringify({ "WHITESPACE": "    whitespace   " }),
        `WHITESPACE='    whitespace   '`,
      ),
  );
  await t.step(
    "equals",
    () =>
      assertEquals(
        stringify({ "EQUALS": "equ==als" }),
        `EQUALS='equ==als'`,
      ),
  );
  await t.step(
    "number",
    () =>
      assertEquals(
        stringify({ "THE_ANSWER": "42" }),
        `THE_ANSWER=42`,
      ),
  );
  await t.step(
    "undefined",
    () =>
      assertEquals(
        stringify(
          { "UNDEFINED": undefined } as unknown as Record<string, string>,
        ),
        `UNDEFINED=`,
      ),
  );
  await t.step(
    "null",
    () =>
      assertEquals(
        stringify({ "NULL": null } as unknown as Record<string, string>),
        `NULL=`,
      ),
  );
});

Deno.test("use restrictEnvAccessTo to restrict lookup of Env variables to certain vars. Those vars can be granted read permissions now separately.", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-read",
      "--allow-env=GREETING",
      path.join(testdataDir, "./app_with_restricted_env_access.ts"),
    ],
    cwd: testdataDir,
  });
  const { stdout } = await command.output();

  const decoder = new TextDecoder();
  const conf = JSON.parse(decoder.decode(stdout).trim());

  assertEquals(conf.GREETING, "hello world", "fetches .env by default");
  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");
});

Deno.test("use restrictEnvAccessTo via loadSync to restrict lookup of Env variables to certain vars.", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-read",
      "--allow-env=GREETING",
      path.join(testdataDir, "./app_with_restricted_env_access_sync.ts"),
    ],
    cwd: testdataDir,
  });
  const { stdout } = await command.output();

  const decoder = new TextDecoder();
  const conf = JSON.parse(decoder.decode(stdout).trim());

  assertEquals(conf.GREETING, "hello world", "fetches .env by default");
  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");
});

Deno.test("use of restrictEnvAccessTo for an Env var, without granting env permissions still fails", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-read",
      path.join(testdataDir, "./app_with_restricted_env_access.ts"),
    ],
    cwd: testdataDir,
  });
  const { stdout } = await command.output();

  const decoder = new TextDecoder();
  const error = decoder.decode(stdout).trim();

  assertStringIncludes(error, 'Requires env access to "GREETING"');
});

Deno.test("type inference based on restrictEnvAccessTo", async (t) => {
  await t.step("return type is inferred", async () => {
    const conf = await load({
      ...testOptions,
      restrictEnvAccessTo: ["GREETING"],
    });

    assertType<
      IsExact<typeof conf, { GREETING: string }>
    >(true);

    assertType<
      IsExact<typeof conf, { NO_SUCH_KEY: string }>
    >(false);

    assertType<
      IsExact<typeof conf, Record<string, string>>
    >(false);

    assertEquals(conf.DEFAULT1, "Some Default");
  });

  await t.step("readonly array is also supported", () => {
    const conf = loadSync({
      ...testOptions,
      restrictEnvAccessTo: ["GREETING", "DEFAULT1"] as const,
    });

    assertType<
      IsExact<typeof conf, { GREETING: string; DEFAULT1: string }>
    >(true);
  });

  await t.step("without restrictEnvAccessTo", async () => {
    const conf = await load(testOptions);

    assertType<
      IsExact<typeof conf, { GREETING: string }>
    >(false);

    assertType<IsExact<typeof conf, Record<string, string>>>(true);
  });
});
