// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  DenoEnv,
  Env,
  EnvObject,
  optionalReadTextFile,
  optionalReadTextFileSync,
  setDenoEnv,
  verify,
} from "./_util.ts";

export type { DenoEnv, Env, EnvObject };

const regExp =
  /^\s*(?<comment>#.+)|(?<export>export\s+)?(?<key>[a-zA-Z_]\w*)\s*=\s*((?<quote>["'`])?(?<value>.+?)\5?)?\s*?$/;

export interface ParseOptions {
  allowEmptyValues?: boolean;
  example?: EnvObject;
}
/**
 * @param source dotenv string to be parsed
 * @param options parsing options
 * @returns EnvObject
 * ```ts
 * import { parse } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";
 *
 * const object = parse(`
 * GREETING=hello world
 * export EXPORT=exported
 * `);
 * ```
 */
export function parse(
  source: string,
  { allowEmptyValues = false, example }: ParseOptions = {},
): EnvObject {
  const env: Env = {};
  const exports: Set<string> = new Set();

  const lines = source.split("\n");
  for (const line of lines) {
    const groups = regExp.exec(line)?.groups;

    // if line is invalid
    if (!groups) continue;
    // if line is a comment
    if (groups.comment) continue;

    let value = groups.value ?? "";

    if (groups.quote === `'`) {
      // do nothing, preseve newlines
    } else if (groups.quote === `"`) {
      value = value.replaceAll("\\n", "\n");
    } else {
      const hashIndex = value.indexOf("#");
      if (hashIndex >= 0) {
        value = value.slice(0, hashIndex);
      }
      value = value.trim();
    }

    env[groups.key] = value;

    if (groups.export != null) {
      exports.add(groups.key);
    }
  }
  const object: EnvObject = { env, exports: [...exports] };

  if (example) {
    const exampleEnv = example.env;
    verify(object, exampleEnv, { allowEmptyValues });
  }

  return object;
}

/**
 * @param object EnvObject to be stringified
 * @returns string of EnvObject
 * ```ts
 * import { stringify } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";
 *
 * const object = { env: { GREETING: "hello world", EXPORT: "exported" }, exports: ["EXPORT"] };
 * const string = stringify(object);
 * ```
 */
export function stringify(object: EnvObject) {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(object.env)) {
    let quote;

    let escapedValue = value ?? "";

    if (escapedValue.includes("\n")) {
      // escape inner new lines
      escapedValue = escapedValue.replaceAll("\n", "\\n");
      quote = `"`;
    } else if (escapedValue.match(/[ \W]/)) {
      quote = "'";
    }

    if (quote) {
      // escape inner quotes
      escapedValue = escapedValue.replaceAll(quote, `\\${quote}`);
      escapedValue = `${quote}${escapedValue}${quote}`;
    }
    const line = `${
      object.exports.includes(key) ? "export " : ""
    }${key}=${escapedValue}`;
    lines.push(line);
  }
  return lines.join("\n");
}

export interface LoadOptions {
  envPath?: string | URL;
  examplePath?: string | URL;
  defaultsPath?: string | URL;
  allowEmptyValues?: boolean;
}

function setDenoEnvFromSources(
  denoEnv: DenoEnv,
  envSource: string,
  { allowEmptyValues, exampleSource, defaultsSource }: {
    allowEmptyValues?: boolean;
    exampleSource?: string;
    defaultsSource?: string;
  },
) {
  const example = exampleSource ? parse(exampleSource) : undefined;
  const parsedObject = parse(envSource, { example, allowEmptyValues });
  const defaultsEnv = defaultsSource ? parse(defaultsSource).env : {};

  const env: Env = {
    ...defaultsEnv,
    ...parsedObject.env,
  };

  return setDenoEnv(denoEnv, env);
}

/**
 * @param denoEnv denoEnv to load variables into
 * @param options load options
 * @returns populated denoEnv
 * ```ts
 * import { load } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";
 *
 * const object = await load(Deno.env, { envPath: "path/to/.env" });
 * ```
 */
export async function load(
  denoEnv: DenoEnv = Deno.env,
  {
    envPath = ".env",
    examplePath = ".env.example",
    defaultsPath = ".env.defaults",
    allowEmptyValues,
  }: LoadOptions = {},
) {
  const exampleSource = await optionalReadTextFile(examplePath);
  const defaultsSource = await optionalReadTextFile(defaultsPath);

  const envSource = await Deno.readTextFile(envPath);
  return setDenoEnvFromSources(denoEnv, envSource, {
    allowEmptyValues,
    exampleSource,
    defaultsSource,
  });
}

/**
 * @param denoEnv denoEnv to load variables into
 * @param options load options
 * @returns populated denoEnv
 * ```ts
 * import { loadSync } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";
 *
 * const object = loadSync(Deno.env, { envPath: "path/to/.env" });
 * ```
 */
export function loadSync(
  denoEnv: DenoEnv = Deno.env,
  {
    envPath = ".env",
    examplePath = ".env.example",
    defaultsPath = ".env.defaults",
  }: LoadOptions = {},
) {
  const exampleSource = optionalReadTextFileSync(examplePath);
  const defaultsSource = optionalReadTextFileSync(defaultsPath);

  const envSource = Deno.readTextFileSync(envPath);
  return setDenoEnvFromSources(denoEnv, envSource, {
    exampleSource,
    defaultsSource,
  });
}

/**
 * @deprecated use `loadOptions` instead
 */
export interface ConfigOptions {
  path: string;
  export?: boolean;
  safe?: boolean;
  example?: string;
  allowEmptyValues?: boolean;
  defaults?: string;
}

/**
 * @deprecated use `loadSync` instead
 */
export function configSync(
  {
    path = ".env",
    example = ".env.example",
    defaults = ".env.defaults",
    export: _export,
    safe,
    allowEmptyValues,
  }: Partial<ConfigOptions> = {},
): Env {
  const source = optionalReadTextFileSync(path);
  const object: EnvObject = source ? parse(source) : { env: {}, exports: [] };

  let defaultsEnv = {};
  if (defaults) {
    const defaultsSource = optionalReadTextFileSync(defaults);
    if (defaultsSource) defaultsEnv = parse(defaultsSource).env;
  }

  const conf = { ...object.env, ...defaultsEnv };

  if (safe && example) {
    const exampleSource = optionalReadTextFileSync(example);
    const exampleEnv = exampleSource ? parse(exampleSource).env : {};
    const denoEnv = Deno.env.toObject();
    verify(object, exampleEnv, {
      allowEmptyValues,
      defaultsEnv: denoEnv,
    });
  }

  if (_export) setDenoEnv(Deno.env, conf);

  return conf;
}

/**
 * @deprecated use `load` instead
 */
export async function config(
  {
    path = ".env",
    example = ".env.example",
    defaults = ".env.defaults",
    export: _export,
    safe,
    allowEmptyValues,
  }: Partial<ConfigOptions> = {},
): Promise<Env> {
  const source = await optionalReadTextFile(path);
  const object: EnvObject = source ? parse(source) : { env: {}, exports: [] };

  let defaultsEnv = {};
  if (defaults) {
    const defaultsSource = await optionalReadTextFile(defaults);
    if (defaultsSource) defaultsEnv = parse(defaultsSource).env;
  }

  const conf = { ...object.env, ...defaultsEnv };

  if (safe && example) {
    const exampleSource = await optionalReadTextFile(example);
    const exampleEnv = exampleSource ? parse(exampleSource).env : {};
    const denoEnv = Deno.env.toObject();
    verify(object, exampleEnv, {
      allowEmptyValues,
      defaultsEnv: denoEnv,
    });
  }

  if (_export) setDenoEnv(Deno.env, conf);

  return conf;
}
