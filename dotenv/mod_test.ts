// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "../testing/asserts.ts";
import { load, loadSync, MissingEnvVarsError, parse } from "./mod.ts";
import * as path from "../path/mod.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

const testOptions = {
  path: path.join(testdataDir, "./.env"),
  defaults: path.join(testdataDir, "./.env.defaults"),
};

Deno.test("parser", () => {
  const testDotenv = Deno.readTextFileSync(
    path.join(testdataDir, "./.env.test"),
  );

  const config = parse(testDotenv);
  assertEquals(config.BASIC, "basic", "parses a basic variable");
  assertEquals(config.AFTER_EMPTY, "empty", "skips empty lines");
  assertEquals(config["#COMMENT"], undefined, "skips lines with comments");
  assertEquals(config.EMPTY_VALUE, "", "empty values are empty strings");

  assertEquals(
    config.QUOTED_SINGLE,
    "single quoted",
    "single quotes are escaped",
  );

  assertEquals(
    config.QUOTED_DOUBLE,
    "double quoted",
    "double quotes are escaped",
  );

  assertEquals(
    config.MULTILINE,
    "hello\nworld",
    "new lines are expanded in double quotes",
  );

  assertEquals(
    JSON.parse(config.JSON).foo,
    "bar",
    "inner quotes are maintained",
  );

  assertEquals(
    config.WHITESPACE,
    "    whitespace   ",
    "whitespace in single-quoted values is preserved",
  );

  assertEquals(
    config.WHITESPACE_DOUBLE,
    "    whitespace   ",
    "whitespace in double-quoted values is preserved",
  );

  assertEquals(
    config.MULTILINE_SINGLE_QUOTE,
    "hello\\nworld",
    "new lines are escaped in single quotes",
  );

  assertEquals(config.EQUALS, "equ==als", "handles equals inside string");

  assertEquals(
    config.VAR_WITH_SPACE,
    "var with space",
    "variables defined with spaces are parsed",
  );

  assertEquals(
    config.VAR_WITH_ENDING_WHITESPACE,
    "value",
    "variables defined with ending whitespace are trimmed",
  );

  assertEquals(
    config.V4R_W1TH_NUM8ER5,
    "var with numbers",
    "accepts variables containing number",
  );

  assertEquals(
    config["1INVALID"],
    undefined,
    "variables beginning with a number are not parsed",
  );

  assertEquals(
    config.INDENTED_VAR,
    "indented var",
    "accepts variables that are indented with space",
  );

  assertEquals(
    config.INDENTED_VALUE,
    "indented value",
    "accepts values that are indented with space",
  );

  assertEquals(
    config.TAB_INDENTED_VAR,
    "indented var",
    "accepts variables that are indented with tabs",
  );

  assertEquals(
    config.TAB_INDENTED_VALUE,
    "indented value",
    "accepts values that are indented with tabs",
  );
});

Deno.test("with comments", () => {
  const testDotenv = Deno.readTextFileSync(
    path.join(testdataDir, "./.env.comments"),
  );

  const config = parse(testDotenv);
  assertEquals(config.FOO, "bar");
  assertEquals(config.GREETING, "hello world");
});

Deno.test("configure", () => {
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
        path: "./.some.non.existent.env",
        defaults: "./.some.non.existent.env",
      },
    ),
    {},
    "returns empty object if file doesn't exist",
  );

  const originalDenoReadFileSync = Deno.readFileSync;
  try {
    // @ts-ignore: for test
    delete Deno.readFileSync;
    assertEquals(
      loadSync(testOptions),
      {},
      "returns empty object if Deno.readFileSync is not a function",
    );
  } finally {
    Deno.readFileSync = originalDenoReadFileSync;
  }

  assertEquals(
    loadSync({
      path: "./.some.non.existent.env",
      defaults: testOptions.defaults,
    }),
    { DEFAULT1: "Some Default" },
    "returns with defaults if file doesn't exist",
  );
});

Deno.test("configureSafe", () => {
  // Default
  let conf = loadSync({
    ...testOptions,
    safe: true,
  });
  assertEquals(conf.GREETING, "hello world", "fetches .env");

  // Custom .env.example
  conf = loadSync({
    safe: true,
    ...testOptions,
    example: path.join(testdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts a path to fetch env example from",
  );

  // Custom .env and .env.example
  conf = loadSync({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example.test"),
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
      path: path.join(testdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  assertEquals(error.missing, ["ANOTHER"]);

  // Throws if any of the required vars is empty
  error = assertThrows(() => {
    loadSync({
      path: path.join(testdataDir, "./.env.safe.empty.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  assertEquals(error.missing, ["ANOTHER"]);

  // Does not throw if required vars are provided by example
  loadSync({
    path: path.join(testdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example3.test"),
    defaults: path.join(moduleDir, "./.env.defaults"),
  });

  // Does not throw if any of the required vars is empty, *and* allowEmptyValues is present
  loadSync({
    path: path.join(testdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });

  // Does not throw if any of the required vars passed externally
  Deno.env.set("ANOTHER", "VAR");
  loadSync({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
  });

  // Throws if any of the required vars passed externally is empty
  Deno.env.set("ANOTHER", "");
  assertThrows(() => {
    loadSync({
      path: path.join(testdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  });

  // Does not throw if any of the required vars passed externally is empty, *and* allowEmptyValues is present
  Deno.env.set("ANOTHER", "");
  loadSync({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });
});

Deno.test("configure async", async () => {
  let conf = await load(testOptions);
  assertEquals(conf.GREETING, "hello world", "fetches .env");

  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");

  conf = await load({ path: path.join(testdataDir, "./.env.test") });
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
        path: "./.some.non.existent.env",
        defaults: "./.some.non.existent.env",
      },
    ),
    {},
    "returns empty object if file doesn't exist",
  );

  assertEquals(
    await load({ ...testOptions, path: "./.some.non.existent.env" }),
    { DEFAULT1: "Some Default" },
    "returns with defaults if file doesn't exist",
  );
});

Deno.test("configureSafe async", async () => {
  // Default
  let conf = await load({
    ...testOptions,
    safe: true,
  });
  assertEquals(conf.GREETING, "hello world", "fetches .env");

  // Custom .env.example
  conf = await load({
    safe: true,
    ...testOptions,
    example: path.join(testdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts a path to fetch env example from",
  );

  // Custom .env and .env.example
  conf = await load({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example.test"),
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
      path: path.join(testdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  assertEquals(error.missing, ["ANOTHER"]);

  // Throws if any of the required vars is empty
  error = await assertRejects(async () => {
    await load({
      path: path.join(testdataDir, "./.env.safe.empty.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  assertEquals(error.missing, ["ANOTHER"]);

  // Does not throw if required vars are provided by example
  await load({
    path: path.join(testdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example3.test"),
    defaults: path.join(moduleDir, "./.env.defaults"),
  });

  // Does not throw if any of the required vars is empty, *and* allowEmptyValues is present
  await load({
    path: path.join(testdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });

  // Does not throw if any of the required vars passed externally
  Deno.env.set("ANOTHER", "VAR");
  await load({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
  });

  // Throws if any of the required vars passed externally is empty
  Deno.env.set("ANOTHER", "");
  assertRejects(async () => {
    await load({
      path: path.join(testdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  });

  // Does not throw if any of the required vars passed externally is empty, *and* allowEmptyValues is present
  Deno.env.set("ANOTHER", "");
  await load({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });
});

Deno.test("config defaults", async () => {
  const { stdout } = await Deno.spawn(Deno.execPath(), {
    args: [
      "run",
      "--allow-read",
      "--allow-env",
      path.join(testdataDir, "./app_defaults.ts"),
    ],
    cwd: testdataDir,
  });

  const decoder = new TextDecoder();
  const conf = JSON.parse(decoder.decode(stdout).trim());

  assertEquals(conf.GREETING, "hello world", "fetches .env by default");

  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");
});
