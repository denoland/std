// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

export interface DotEnvObject {
  env: Record<string, string>;
  exports: string[];
}

// Deno should expose a type for Deno.env
// Ideally Map-like as discussed in https://github.com/denoland/deno/issues/10349
export interface DenoEnv {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  toObject(): {
    [index: string]: string;
  };
}

export const EXPORT_REGEX = /^\s*export\s+/;

export function verify(
  object: DotEnvObject,
  { allowEmptyValues, example }: {
    allowEmptyValues: boolean;
    example?: DotEnvObject;
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

    const missingExports = example.exports
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
  /^\s*(?<comment>#.+)|(?<export>export\s+)?(?<key>[a-zA-Z_]\w*)\s*=\s*((?<quotes>["'])?(?<value>.+?)\5?)?\s*?$/;

export function parse(
  source: string,
  { allowEmptyValues = false, example }: {
    allowEmptyValues?: boolean;
    example?: DotEnvObject;
  } = {},
): DotEnvObject {
  const env: Record<string, string> = {};
  const exports: Set<string> = new Set();

  const lines = source.split("\n");
  for (const line of lines) {
    const groups = regExp.exec(line)?.groups;

    if (!groups) continue;

    if (groups.export != null) exports.add(groups.key);

    let value = groups.value || "";

    if (groups.quotes === `'`) {
      // do nothing, preseve newlines
    } else if (groups.quotes === `"`) {
      value = value.replaceAll("\\n", "\n");
    } else {
      value = value.trim();
    }

    env[groups.key] = value;
  }

  const object = { env, exports: [...exports] };
  verify(object, { allowEmptyValues, example });

  return object;
}

// would be a nice to be able to generate .env files and complete parse/stringify pair like in JSON
// export function stringify(object: DotEnvObject) {
// }
