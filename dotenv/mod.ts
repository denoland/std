// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * Load environmental variables using `.env` files.
 *
 * @module
 */

import { difference, removeEmptyValues, setDenoEnv } from "./util.ts";

/**
 * @deprecated use Record<string, string> instead
 */
export interface DotenvConfig {
  [key: string]: string;
}

/**
 * @deprecated use LoadOptions instead
 */
export interface ConfigOptions {
  path?: string;
  export?: boolean;
  safe?: boolean;
  example?: string;
  allowEmptyValues?: boolean;
  defaults?: string;
}

export interface LoadOptions {
  envPath?: string;
  examplePath?: string;
  allowEmptyValues?: boolean;
  defaultsPath?: string;
}

const RE_VariableStart = /^\s*[a-zA-Z_][a-zA-Z_0-9 ]*\s*=/;
const RE_SingleQuotes = /^'([\s\S]*)'$/;
const RE_DoubleQuotes = /^"([\s\S]*)"$/;

export function parse(rawDotenv: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const line of rawDotenv.split("\n")) {
    if (!RE_VariableStart.test(line)) continue;
    const eqIdx = line.indexOf("=");
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1);
    const hashIdx = value.indexOf("#");
    if (hashIdx >= 0) value = value.slice(0, hashIdx);
    value = value.trim();
    if (RE_SingleQuotes.test(value)) {
      value = value.slice(1, -1);
    } else if (RE_DoubleQuotes.test(value)) {
      value = value.slice(1, -1);
      value = expandNewlines(value);
    } else value = value.trim();
    env[key] = value;
  }

  return env;
}

const defaultLoadOptions = {
  envPath: `.env`,
  export: false,
  examplePath: `.env.example`,
  allowEmptyValues: false,
  defaultsPath: `.env.defaults`,
};

// @timreichen move function code into loadSync function once configSync is removed
function parseEnvFilesSync(options: LoadOptions) {
  const o: Required<LoadOptions> = { ...defaultLoadOptions, ...options };

  const conf = parseFile(o.envPath);

  if (o.defaultsPath) {
    const confDefaults = parseFile(o.defaultsPath);
    for (const key in confDefaults) {
      if (!(key in conf)) {
        conf[key] = confDefaults[key];
      }
    }
  }

  if (o.examplePath) {
    const confExample = parseFile(o.examplePath);
    assertSafe(conf, confExample, o.allowEmptyValues);
  }
  return conf;
}

/**
 * @deprecated use loadSync instead
 */
export function configSync(options: ConfigOptions = {}) {
  const configOptions = {
    envPath: options.path,
    examplePath: options.safe ? options.example : undefined,
    defaultsPath: options.defaults,
    allowEmptyValues: options.allowEmptyValues,
  };
  const conf = parseEnvFilesSync(configOptions);
  if (options.export) {
    setDenoEnv(Deno.env, conf);
  }
  return conf;
}
export function loadSync(options: LoadOptions = {}): Record<string, string> {
  const conf = parseEnvFilesSync(options);
  setDenoEnv(Deno.env, conf);
  return conf;
}

// @timreichen move function code into load function once configSync is removed
async function parseEnvFiles(options: LoadOptions) {
  const o: Required<LoadOptions> = { ...defaultLoadOptions, ...options };

  const conf = await parseFileAsync(o.envPath);

  if (o.defaultsPath) {
    const confDefaults = await parseFileAsync(o.defaultsPath);
    for (const key in confDefaults) {
      if (!(key in conf)) {
        conf[key] = confDefaults[key];
      }
    }
  }

  if (o.examplePath) {
    const confExample = await parseFileAsync(o.examplePath);
    assertSafe(conf, confExample, o.allowEmptyValues);
  }

  return conf;
}

/**
 * @deprecated use load instead
 */
export async function config(options: ConfigOptions = {}) {
  const configOptions = {
    envPath: options.path,
    examplePath: options.safe ? options.example : undefined,
    defaultsPath: options.defaults,
    allowEmptyValues: options.allowEmptyValues,
  };
  const conf = await parseEnvFiles(configOptions);
  if (options.export) {
    setDenoEnv(Deno.env, conf);
  }
  return conf;
}
export async function load(
  options: LoadOptions = {},
): Promise<Record<string, string>> {
  const conf = await parseEnvFiles(options);

  setDenoEnv(Deno.env, conf);

  return conf;
}

function parseFile(filepath: string) {
  try {
    // Avoid errors that occur in deno deploy
    // https://github.com/denoland/deno_std/issues/1957
    if (typeof Deno.readFileSync !== "function") {
      return {};
    }

    return parse(new TextDecoder("utf-8").decode(Deno.readFileSync(filepath)));
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) return {};
    throw e;
  }
}

async function parseFileAsync(filepath: string) {
  try {
    return parse(
      new TextDecoder("utf-8").decode(await Deno.readFile(filepath)),
    );
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) return {};
    throw e;
  }
}

function expandNewlines(str: string): string {
  return str.replaceAll("\\n", "\n");
}

function assertSafe(
  conf: Record<string, string>,
  confExample: Record<string, string>,
  allowEmptyValues: boolean,
) {
  const currentEnv = Deno.env.toObject();

  // Not all the variables have to be defined in .env, they can be supplied externally
  const confWithEnv = Object.assign({}, currentEnv, conf);

  const missing = difference(
    Object.keys(confExample),
    // If allowEmptyValues is false, filter out empty values from loaduration
    Object.keys(
      allowEmptyValues ? confWithEnv : removeEmptyValues(confWithEnv),
    ),
  );

  if (missing.length > 0) {
    const errorMessages = [
      `The following variables were defined in the example file but are not present in the environment:\n  ${
        missing.join(
          ", ",
        )
      }`,
      `Make sure to add them to your env file.`,
      !allowEmptyValues &&
      `If you expect any of these variables to be empty, you can set the allowEmptyValues option to true.`,
    ];

    throw new MissingEnvVarsError(
      errorMessages.filter(Boolean).join("\n\n"),
      missing,
    );
  }
}

export class MissingEnvVarsError extends Error {
  missing: string[];
  constructor(message: string, missing: string[]) {
    super(message);
    this.name = "MissingEnvVarsError";
    this.missing = missing;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
