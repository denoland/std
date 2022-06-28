// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "../testing/asserts.ts";
import { config, configSync, load, loadSync, parse, stringify } from "./mod.ts";
import * as path from "../path/mod.ts";

const originalDenoEnv = Deno.env.toObject();

function restoreDenoEnv() {
  clearDenoEnv();
  for (const [k, v] of Object.entries(originalDenoEnv)) {
    Deno.env.set(k, v);
  }
}

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
    "comment after unquoted",
    () => {
      const { env } = parse(`FOO=bar # this is a comment`);

      assertEquals(env["FOO"], "bar");
    },
  );
  await t.step(
    "comment after single quoted",
    () => {
      const { env } = parse(`GREETING= 'hello world' # hello world`);
      assertEquals(env["GREETING"], "hello world");
    },
  );
  await t.step(
    "comment after double quoted",
    () => {
      const { env } = parse(`GREETING= "hello world" # hello world`);
      assertEquals(env["GREETING"], "hello world");
    },
  );
  await t.step(
    "comment after backticks",
    () => {
      const { env } = parse("GREETING= `hello world` # hello world");
      assertEquals(env["GREETING"], "hello world");
    },
  );
  await t.step(
    "value after comment",
    () => {
      const { env } = parse(`# hello world\nGREETING= "hello world"`);
      assertEquals(env["GREETING"], "hello world");
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
    "unquoted whitespace start trim",
    () => {
      const { env } = parse(`FOO= some value`);
      assertEquals(env["FOO"], "some value");
    },
  );
  await t.step(
    "unquoted tab start trim",
    () => {
      const { env } = parse(`FOO=\tsome value`);
      assertEquals(env["FOO"], "some value");
    },
  );
  await t.step(
    "unquoted whitespace end trim",
    () => {
      const { env } = parse(`FOO=some value `);
      assertEquals(env["FOO"], "some value");
    },
  );
  await t.step(
    "unquoted tab end trim",
    () => {
      const { env } = parse(`FOO=some value\t`);
      assertEquals(env["FOO"], "some value");
    },
  );
  await t.step(
    "single quoted whitespace start trim",
    () => {
      const { env } = parse(`FOO= 'some value'`);
      assertEquals(env["FOO"], "some value");
    },
  );
  await t.step(
    "single quoted tab start trim",
    () => {
      const { env } = parse(`FOO=\t'some value'`);
      assertEquals(env["FOO"], "some value");
    },
  );
  await t.step(
    "double quoted whitespace start trim",
    () => {
      const { env } = parse(`FOO= "some value"`);
      assertEquals(env["FOO"], "some value");
    },
  );
  await t.step(
    "double quoted tab start trim",
    () => {
      const { env } = parse(`FOO=\t"some value"`);
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
    "backticks whitespace start trim",
    () => {
      const { env } = parse("FOO= `some value`");
      assertEquals(env["FOO"], "some value");
    },
  );
  await t.step(
    "backticks tab start trim",
    () => {
      const { env } = parse("FOO=\t`some value`");
      assertEquals(env["FOO"], "some value");
    },
  );

  await t.step(
    "non-word characters",
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
    "export",
    () => {
      const { env } = parse(`export BASIC=basic`);
      assertEquals(env["BASIC"], "basic");
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
    "key whitespace start trim",
    () => {
      const { env } = parse(`  INDENTED_VAR='indented var'`);
      assertEquals(env["INDENTED_VAR"], "indented var");
    },
  );
  await t.step(
    "key tab start trim",
    () => {
      const { env } = parse(`\tINDENTED_VAR='indented var'`);
      assertEquals(env["INDENTED_VAR"], "indented var");
    },
  );

  await t.step(
    "key whitespace end trim",
    () => {
      const { env } = parse(`VAR_WITH_ENDING_WHITESPACE   =value`);
      assertEquals(env["VAR_WITH_ENDING_WHITESPACE"], "value");
    },
  );
  await t.step(
    "key tab end trim",
    () => {
      const { env } = parse(`VAR_WITH_ENDING_WHITESPACE\t=value`);
      assertEquals(env["VAR_WITH_ENDING_WHITESPACE"], "value");
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
    "single quote multiline",
    () => {
      const { env } = parse(`MULTILINE='hello\nworld'`);
      assertEquals(env["MULTILINE"], "hello\\nworld");
    },
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

Deno.test("load", async () => {
  clearDenoEnv(); // @timreichen remove after config and configSync tests are removed
  await load(Deno.env, {
    envPath: path.join(testdataDir, ".env.test"),
    examplePath: path.join(testdataDir, ".env.example.test"),
    defaultsPath: path.join(testdataDir, ".env.defaults.test"),
  });
  assertEquals(Deno.env.get("GREETING"), "Hello World");
  assertEquals(Deno.env.get("DEFAULT"), "Some Default");
  restoreDenoEnv();
});
Deno.test("loadSync", () => {
  clearDenoEnv(); // @timreichen remove after config and configSync tests are removed
  loadSync(Deno.env, {
    envPath: path.join(testdataDir, ".env.test"),
    examplePath: path.join(testdataDir, ".env.example.test"),
    defaultsPath: path.join(testdataDir, ".env.defaults.test"),
  });
  assertEquals(Deno.env.get("GREETING"), "Hello World");
  assertEquals(Deno.env.get("DEFAULT"), "Some Default");
  restoreDenoEnv();
});

/**
 * @deprecated tests using `config` and `configSync`
 */
const configTestdataDir = path.resolve(moduleDir, "testdata/_config");

const testOptions = {
  path: path.join(configTestdataDir, "./.env"),
  defaults: path.join(configTestdataDir, "./.env.defaults"),
};

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

  assertEquals(
    configSync({
      path: "./.some.non.existent.env",
      defaults: testOptions.defaults,
    }),
    { DEFAULT1: "Some Default" },
    "returns with defaults if file doesn't exist",
  );
  restoreDenoEnv();
});

Deno.test("configure .env.test", () => {
  const source = Deno.readTextFileSync(
    path.join(configTestdataDir, ".env.test"),
  );
  assertEquals(parse(source), {
    env: {
      BASIC: "basic",
      AFTER_EMPTY: "empty",
      EMPTY_VALUE: "",
      QUOTED_SINGLE: "single quoted",
      QUOTED_DOUBLE: "double quoted",
      MULTILINE: "hello\nworld",
      JSON: '{"foo": "bar"}',
      WHITESPACE: "    whitespace   ",
      WHITESPACE_DOUBLE: "    whitespace   ",
      MULTILINE_SINGLE_QUOTE: "hello\\nworld",
      EQUALS: "equ==als",
      THE_ANSWER: "42",
      VAR_WITH_SPACE: "var with space",
      VAR_WITH_ENDING_WHITESPACE: "value",
      V4R_W1TH_NUM8ER5: "var with numbers",
      INVALID: "var starting with a number",
      INDENTED_VAR: "indented var",
      INDENTED_VALUE: "indented value",
      TAB_INDENTED_VAR: "indented var",
      TAB_INDENTED_VALUE: "indented value",
    },
    exports: [],
  });
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
    example: path.join(configTestdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts a path to fetch env example from",
  );

  // Custom .env and .env.example
  conf = configSync({
    path: path.join(configTestdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(configTestdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts paths to fetch env and env example from",
  );

  let error: MissingEnvVarsError;

  // Throws if not all required vars are there
  error = assertThrows(() => {
    configSync({
      path: path.join(configTestdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(configTestdataDir, "./.env.example2.test"),
    });
  });

  assertEquals(error.missing, ["ANOTHER"]);

  // Throws if any of the required vars is empty
  error = assertThrows(() => {
    configSync({
      path: path.join(configTestdataDir, "./.env.safe.empty.test"),
      safe: true,
      example: path.join(configTestdataDir, "./.env.example2.test"),
    });
  });

  assertEquals(error.missing, ["ANOTHER"]);

  // Does not throw if required vars are provided by example
  configSync({
    path: path.join(configTestdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(configTestdataDir, "./.env.example3.test"),
    defaults: path.join(moduleDir, "./.env.defaults"),
  });

  // Does not throw if any of the required vars is empty, *and* allowEmptyValues is present
  configSync({
    path: path.join(configTestdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(configTestdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });

  // Does not throw if any of the required vars passed externally
  Deno.env.set("ANOTHER", "VAR");
  configSync({
    path: path.join(configTestdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(configTestdataDir, "./.env.example2.test"),
  });

  // Throws if any of the required vars passed externally is empty
  Deno.env.set("ANOTHER", "");
  assertThrows(() => {
    configSync({
      path: path.join(configTestdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(configTestdataDir, "./.env.example2.test"),
    });
  });

  // Does not throw if any of the required vars passed externally is empty, *and* allowEmptyValues is present
  Deno.env.set("ANOTHER", "");
  configSync({
    path: path.join(configTestdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(configTestdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });
  restoreDenoEnv();
});

Deno.test("configure async", async () => {
  let conf = await config(testOptions);
  assertEquals(conf.GREETING, "hello world", "fetches .env");

  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");

  conf = await config({ path: path.join(configTestdataDir, "./.env.test") });
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
  restoreDenoEnv();
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
    example: path.join(configTestdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts a path to fetch env example from",
  );

  // Custom .env and .env.example
  conf = await config({
    path: path.join(configTestdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(configTestdataDir, "./.env.example.test"),
  });

  assertEquals(
    conf.GREETING,
    "hello world",
    "accepts paths to fetch env and env example from",
  );

  let error: MissingEnvVarsError;

  // Throws if not all required vars are there
  error = await assertRejects(async () => {
    await config({
      path: path.join(configTestdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(configTestdataDir, "./.env.example2.test"),
    });
  });

  assertEquals(error.missing, ["ANOTHER"]);

  // Throws if any of the required vars is empty
  error = await assertRejects(async () => {
    await config({
      path: path.join(configTestdataDir, "./.env.safe.empty.test"),
      safe: true,
      example: path.join(configTestdataDir, "./.env.example2.test"),
    });
  });

  assertEquals(error.missing, ["ANOTHER"]);

  // Does not throw if required vars are provided by example
  await config({
    path: path.join(configTestdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(configTestdataDir, "./.env.example3.test"),
    defaults: path.join(moduleDir, "./.env.defaults"),
  });

  // Does not throw if any of the required vars is empty, *and* allowEmptyValues is present
  await config({
    path: path.join(configTestdataDir, "./.env.safe.empty.test"),
    safe: true,
    example: path.join(configTestdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });

  // Does not throw if any of the required vars passed externally
  Deno.env.set("ANOTHER", "VAR");
  await config({
    path: path.join(configTestdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(configTestdataDir, "./.env.example2.test"),
  });

  // Throws if any of the required vars passed externally is empty
  Deno.env.set("ANOTHER", "");
  assertRejects(async () => {
    await config({
      path: path.join(configTestdataDir, "./.env.safe.test"),
      safe: true,
      example: path.join(configTestdataDir, "./.env.example2.test"),
    });
  });

  // Does not throw if any of the required vars passed externally is empty, *and* allowEmptyValues is present
  Deno.env.set("ANOTHER", "");
  await config({
    path: path.join(configTestdataDir, "./.env.safe.test"),
    safe: true,
    example: path.join(configTestdataDir, "./.env.example2.test"),
    allowEmptyValues: true,
  });

  restoreDenoEnv();
});

Deno.test("configure defaults", async () => {
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--allow-read",
      "--allow-env",
      path.join(configTestdataDir, "./app_defaults.ts"),
    ],
    cwd: configTestdataDir,
    stdout: "piped",
  });

  const decoder = new TextDecoder();
  const rawOutput = await p.output();
  const conf = JSON.parse(decoder.decode(rawOutput).trim());
  p.close();

  assertEquals(conf.GREETING, "hello world", "fetches .env by default");

  assertEquals(conf.DEFAULT1, "Some Default", "default value loaded");
});
