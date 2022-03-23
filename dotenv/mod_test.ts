// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "../testing/asserts.ts";
import { config, configSync, MissingEnvVarsError, parse } from "./mod.ts";
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

Deno.test("configure", () => {
  let conf = configSync(testOptions);

  assertEquals(conf.GREETING, "hello world", "fetches .env");

  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");

  conf = configSync({ ...testOptions, export: true });
  assertEquals(
    Deno.env.get("GREETING"),
    "hello world",
    "exports variables to env when requested",
  );

  Deno.env.set("DO_NOT_OVERRIDE", "Hello there");
  conf = configSync({ ...testOptions, export: true });
  assertEquals(
    Deno.env.get("DO_NOT_OVERRIDE"),
    "Hello there",
    "does not export .env value if environment variable is already set",
  );

  assertEquals(
    configSync(
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
      configSync(testOptions),
      {},
      "returns empty object if Deno.readFileSync is not a function",
    );
  } finally {
    Deno.readFileSync = originalDenoReadFileSync;
  }

  assertEquals(
    configSync({
      path: "./.some.non.existent.env",
      defaults: testOptions.defaults,
    }),
    { DEFAULT1: "Some Default" },
    "returns with defaults if file doesn't exist",
  );
});

Deno.test("configureSafe", () => {
  // Default
  let conf = configSync({
    ...testOptions,
    safe: true,
  });
  assertEquals(conf.GREETING, "hello world", "fetches .env");

  // Custom .env.example
  conf = configSync({
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
  conf = configSync({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts paths to fetch env and env example from",
  );

  // Throws if not all required vars are there
  assertThrows(() => {
    configSync({
      path: path.join(testdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  // Throws if any of the required vars is empty
  assertThrows(() => {
    configSync({
      path: path.join(testdataDir, "./.env.safe.empty.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  // Does not throw if required vars are provided by example
  configSync({
    path: path.join(testdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example3.test"),
    defaults: path.join(moduleDir, "./.env.defaults"),
  });

  // Does not throw if any of the required vars is empty, *and* allowEmptyValues is present
  configSync({
    path: path.join(testdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });

  // Does not throw if any of the required vars passed externally
  Deno.env.set("ANOTHER", "VAR");
  configSync({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
  });

  // Throws if any of the required vars passed externally is empty
  Deno.env.set("ANOTHER", "");
  assertThrows(() => {
    configSync({
      path: path.join(testdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  });

  // Does not throw if any of the required vars passed externally is empty, *and* allowEmptyValues is present
  Deno.env.set("ANOTHER", "");
  configSync({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });
});

Deno.test("configure async", async () => {
  let conf = await config(testOptions);
  assertEquals(conf.GREETING, "hello world", "fetches .env");

  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");

  conf = await config({ path: path.join(testdataDir, "./.env.test") });
  assertEquals(conf.BASIC, "basic", "accepts a path to fetch env from");

  conf = await config({ ...testOptions, export: true });
  assertEquals(
    Deno.env.get("GREETING"),
    "hello world",
    "exports variables to env when requested",
  );

  Deno.env.set("DO_NOT_OVERRIDE", "Hello there");
  conf = await config({ ...testOptions, export: true });
  assertEquals(
    Deno.env.get("DO_NOT_OVERRIDE"),
    "Hello there",
    "does not export .env value if environment variable is already set",
  );

  assertEquals(
    await config(
      {
        path: "./.some.non.existent.env",
        defaults: "./.some.non.existent.env",
      },
    ),
    {},
    "returns empty object if file doesn't exist",
  );

  assertEquals(
    await config({ ...testOptions, path: "./.some.non.existent.env" }),
    { DEFAULT1: "Some Default" },
    "returns with defaults if file doesn't exist",
  );
});

Deno.test("configureSafe async", async () => {
  // Default
  let conf = await config({
    ...testOptions,
    safe: true,
  });
  assertEquals(conf.GREETING, "hello world", "fetches .env");

  // Custom .env.example
  conf = await config({
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
  conf = await config({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts paths to fetch env and env example from",
  );

  // Throws if not all required vars are there
  assertRejects(async () => {
    await config({
      path: path.join(testdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  // Throws if any of the required vars is empty
  assertRejects(async () => {
    await config({
      path: path.join(testdataDir, "./.env.safe.empty.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  }, MissingEnvVarsError);

  // Does not throw if required vars are provided by example
  await config({
    path: path.join(testdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example3.test"),
    defaults: path.join(moduleDir, "./.env.defaults"),
  });

  // Does not throw if any of the required vars is empty, *and* allowEmptyValues is present
  await config({
    path: path.join(testdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });

  // Does not throw if any of the required vars passed externally
  Deno.env.set("ANOTHER", "VAR");
  await config({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
  });

  // Throws if any of the required vars passed externally is empty
  Deno.env.set("ANOTHER", "");
  assertRejects(async () => {
    await config({
      path: path.join(testdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(testdataDir, "./.env.example2.test"),
    });
  });

  // Does not throw if any of the required vars passed externally is empty, *and* allowEmptyValues is present
  Deno.env.set("ANOTHER", "");
  await config({
    path: path.join(testdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(testdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });
});

Deno.test("config defaults", async () => {
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--allow-read",
      "--allow-env",
      path.join(testdataDir, "./app_defaults.ts"),
    ],
    cwd: testdataDir,
    stdout: "piped",
  });

  const decoder = new TextDecoder();
  const rawOutput = await p.output();
  const conf = JSON.parse(decoder.decode(rawOutput).trim());
  p.close();

  assertEquals(conf.GREETING, "hello world", "fetches .env by default");

  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");
});
