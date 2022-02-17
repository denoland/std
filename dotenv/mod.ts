// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

export interface DotEnvObject {
  env: Record<string, string>;
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
    if (
      !/^\s*(?:export\s+)?[a-zA-Z_][a-zA-Z_0-9 ]*\s*=/.test(
        line,
      ) /* isAssignmentLine */
    ) {
      continue;
    }
    const lhs = line.slice(0, line.indexOf("=")).trim();

    const isExported = EXPORT_REGEX.test(lhs);
    let key = lhs;
    if (isExported) {
      key = lhs.replace(EXPORT_REGEX, "");
      exports.add(key);
    }
    let value = line.slice(line.indexOf("=") + 1).trim();
    if (/^'([\s\S]*)'$/.test(value) /* hasSingleQuotes */) {
      value = value.slice(1, -1);
    } else if (/^"([\s\S]*)"$/.test(value) /* hasDoubleQuotes */) {
      value = value.slice(1, -1);
      value = value.replaceAll("\\n", "\n") /* expandNewlines */;
    } else value = value.trim();
    env[key] = value;
  }

  const object = { env, exports: [...exports] };
  verify(object, { allowEmptyValues, example });

  return object;
}

export function assign(
  denoEnv: DenoEnv,
  ...objects: Record<string, string>[]
): DenoEnv {
  const object: Record<string, string> = Object.assign({}, ...objects);
  const keys = Object.keys(denoEnv.toObject());
  Object.entries(object).forEach(([key, value]) => {
    if (!keys.includes(key)) denoEnv.set(key, value);
  });
  return denoEnv;
}
