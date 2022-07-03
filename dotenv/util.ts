// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export function removeEmptyValues(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (value === null) return false;
      if (value === undefined) return false;
      if (value === "") return false;
      return true;
    }),
  );
}

export function difference(arrA: string[], arrB: string[]): string[] {
  return arrA.filter((a) => arrB.indexOf(a) < 0);
}

export interface DenoEnv {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  toObject(): {
    [index: string]: string;
  };
}

export function setDenoEnv(
  denoEnv: DenoEnv,
  env: Record<string, string>,
) {
  const initialEnv = denoEnv.toObject();
  for (const [key, value] of Object.entries(env)) {
    // prevent overwrite if value already exists
    if (initialEnv[key] != null) continue;
    denoEnv.set(key, value);
  }
  return denoEnv;
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
