// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

export type Env = Record<string, string>;

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

export async function optionalReadTextFile(path: string | URL) {
  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}
export function optionalReadTextFileSync(path: string | URL) {
  try {
    return Deno.readTextFileSync(path);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

export function setDenoEnv(
  denoEnv: DenoEnv,
  env: Env,
) {
  const initialEnv = denoEnv.toObject();
  for (const [key, value] of Object.entries(env)) {
    // prevent overwrite if value already exists
    if (initialEnv[key] != null) continue;
    denoEnv.set(key, value);
  }
  return denoEnv;
}
export interface VerifyOptions {
  allowEmptyValues?: boolean;
  defaultsEnv?: Env;
}
export function verify(
  object: EnvObject,
  exampleEnv: Env,
  { allowEmptyValues, defaultsEnv = {} }: VerifyOptions = {},
) {
  const env = { ...defaultsEnv, ...object.env };
  let entries = env;

  if (!allowEmptyValues) {
    const valueEntries = Object.entries(entries).filter(
      ([_, value]) => (value != null && value !== ""),
    );
    entries = Object.fromEntries(valueEntries);
  }

  const keys = Object.keys(entries);
  const exampleKeys = Object.keys(exampleEnv);

  const missingVariables = exampleKeys
    .filter((key) => !keys.includes(key));

  if (missingVariables.length) {
    const missingExportsString = missingVariables.join(", ");
    throw new Error(
      `The following variables were defined in the example file but are not present in the environment: ${missingExportsString}`,
    );
  }

  return true;
}
