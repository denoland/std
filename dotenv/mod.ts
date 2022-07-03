// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * Loadure environmental variables using `.env` files.
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

type LineParseResult = {
  key: string;
  unquoted: string;
  interpolated: string;
  notInterpolated: string;
};

type CharactersMap = { [key: string]: string };

const RE_KeyValue =
  /^\s*(?:export\s+)?(?<key>[a-zA-Z_]+[a-zA-Z0-9_]*?)\s*=[\ \t]*('\n?(?<notInterpolated>(.|\n)*?)\n?'|"\n?(?<interpolated>(.|\n)*?)\n?"|(?<unquoted>[^\n#]*)) *#*.*$/gm;

const RE_ExpandValue =
  /(\${(?<inBrackets>.+?)(\:-(?<inBracketsDefault>.+))?}|(?<!\\)\$(?<notInBrackets>\w+)(\:-(?<notInBracketsDefault>.+))?)/g;

export function parse(rawDotenv: string): DotenvConfig {
  const env: DotenvConfig = {};
  let match;
  const keysForExpandCheck = [];

  while ((match = RE_KeyValue.exec(rawDotenv)) != null) {
    const { key, interpolated, notInterpolated, unquoted } = match
      ?.groups as LineParseResult;

    if (unquoted) {
      keysForExpandCheck.push(key);
    }

    env[key] = notInterpolated
      ? notInterpolated
      : interpolated
      ? expandCharacters(interpolated)
      : unquoted.trim();
  }

  //https://github.com/motdotla/dotenv-expand/blob/ed5fea5bf517a09fd743ce2c63150e88c8a5f6d1/lib/main.js#L23
  const variablesMap = { ...env, ...Deno.env.toObject() };
  keysForExpandCheck.forEach((key) => {
    env[key] = expand(env[key], variablesMap);
  });

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

function expandCharacters(str: string): string {
  const charactersMap: CharactersMap = {
    "\\n": "\n",
    "\\r": "\r",
    "\\t": "\t",
  };

  return str.replace(
    /\\([nrt])/g,
    ($1: keyof CharactersMap): string => charactersMap[$1],
  );
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

function expand(str: string, variablesMap: { [key: string]: string }): string {
  if (RE_ExpandValue.test(str)) {
    return expand(
      str.replace(RE_ExpandValue, function (...params) {
        const {
          inBrackets,
          inBracketsDefault,
          notInBrackets,
          notInBracketsDefault,
        } = params[params.length - 1];
        const expandValue = inBrackets || notInBrackets;
        const defaultValue = inBracketsDefault || notInBracketsDefault;

        return variablesMap[expandValue] ||
          expand(defaultValue, variablesMap);
      }),
      variablesMap,
    );
  } else {
    return str;
  }
}
