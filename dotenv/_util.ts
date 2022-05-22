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
