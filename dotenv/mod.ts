// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

type Env = Record<string, string>;

export interface EnvObject {
  env: Env;
  exports: string[];
}

export interface DenoEnv {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  toObject(): {
    [index: string]: string;
  };
}

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

export interface LoadOptions {
  envPath?: string | URL;
  examplePath?: string | URL;
  defaultsPath?: string | URL;
}

export function loadSync(
  denoEnv: DenoEnv = Deno.env,
  {
    envPath = ".env",
    examplePath = ".env.example",
    defaultsPath = ".env.defaults",
  }: LoadOptions = {},
) {
  let example;
  let defaultsEnv = {};
  try {
    const exampleSource = Deno.readTextFileSync(examplePath);
    example = parse(exampleSource);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  try {
    const defaultsSource = Deno.readTextFileSync(defaultsPath);
    defaultsEnv = parse(defaultsSource).env;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  const envSource = Deno.readTextFileSync(envPath);

  const parsedObject = parse(envSource, { example });

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
