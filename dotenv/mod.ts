// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import {
  DenoEnv,
  EnvObject,
  optionalReadTextFile,
  optionalReadTextFileSync,
} from "./_util.ts";

export type { EnvObject };

type Env = Record<string, string>;

export function verify(
  object: EnvObject,
  { allowEmptyValues, example }: {
    allowEmptyValues: boolean;
    example?: EnvObject;
  },
) {
  if (example) {
    let entries = object.env;

    if (!allowEmptyValues) {
      entries = Object.fromEntries(
        Object.entries(object.env)
          .filter(([_, value]) => value != null && value !== ""),
      );
    }

    const keys = Object.keys(entries);
    const missingVars = Object.keys(example.env)
      .filter((key) => !keys.includes(key));

    if (missingVars.length) {
      throw new Error(
        `The following variables were defined in the example file but are not present in the environment: ${
          missingVars.join(", ")
        }`,
      );
    }

    const missingExports = object.exports
      .filter((key) => !keys.includes(key));

    if (missingExports.length) {
      throw new Error(
        `The following variables were exported in the example file but are not exported in the environment: ${
          missingExports.join(", ")
        }`,
      );
    }
  }

  return true;
}

const regExp =
  /^\s*(?<comment>#.+)|(?<export>export\s+)?(?<key>[a-zA-Z_]\w*)\s*=\s*((?<quote>["'`])?(?<value>.+?)\5?)?\s*?$/;

export function parse(
  source: string,
  { allowEmptyValues = false, example }: {
    allowEmptyValues?: boolean;
    example?: EnvObject;
  } = {},
): EnvObject {
  const env: Env = {};
  const exports: Set<string> = new Set();

  const lines = source.split("\n");
  for (const line of lines) {
    const groups = regExp.exec(line)?.groups;

    if (!groups) continue;
    if (groups.comment) continue;

    let value = groups.value || "";

    if (groups.quote === `'`) {
      // do nothing, preseve newlines
    } else if (groups.quote === `"`) {
      value = value.replaceAll("\\n", "\n");
    } else {
      value = value.trim();
    }

    env[groups.key] = value;

    if (groups.export != null) {
      exports.add(groups.key);
    }
  }
  const object: EnvObject = { env, exports: [...exports] };

  verify(object, { allowEmptyValues, example });

  return object;
}

export function stringify(object: EnvObject) {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(object.env)) {
    let quote;

    let escapedValue = value || "";

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
}

function setDenoEnvFromDotEnv(
  denoEnv: DenoEnv,
  envSource: string,
  { exampleSource, defaultsSource }: {
    exampleSource?: string;
    defaultsSource?: string;
  },
) {
  const example = exampleSource ? parse(exampleSource) : undefined;
  const parsedObject = parse(envSource, { example });
  const defaultsEnv = defaultsSource ? parse(defaultsSource).env : {};

  // initialEnv is passed at the end of assign to prevent overwrites
  const env: Env = {
    ...defaultsEnv,
    ...parsedObject.env,
  };

  const initialEnv = denoEnv.toObject();
  for (const [key, value] of Object.entries(env)) {
    if (initialEnv[key] != null) continue;
    denoEnv.set(key, value);
  }
  return denoEnv;
}

export async function load(
  denoEnv: DenoEnv = Deno.env,
  {
    envPath = ".env",
    examplePath = ".env.example",
    defaultsPath = ".env.defaults",
  }: LoadOptions = {},
) {
  const exampleSource = await optionalReadTextFile(examplePath);
  const defaultsSource = await optionalReadTextFile(defaultsPath);

  const envSource = await Deno.readTextFile(envPath);
  return setDenoEnvFromDotEnv(denoEnv, envSource, {
    exampleSource,
    defaultsSource,
  });
}

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
  return setDenoEnvFromDotEnv(denoEnv, envSource, {
    exampleSource,
    defaultsSource,
  });
}
