// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import * as path from "./path/mod.ts";

type Replacer = (key: string, value: any) => any;

export interface WriteJsonOption {
  spaces?: number | string;
  replacer?: Array<number | string> | Replacer;
}

/* Writes an object to a JSON file. */
export async function writeJson(
  filePath: string,
  object: any,
  options: WriteJsonOption = {}
): Promise<void> {
  filePath = path.resolve(filePath);

  let contentRaw: string = "";

  try {
    contentRaw = JSON.stringify(
      object,
      options.replacer as string[],
      options.spaces
    );
  } catch (err) {
    err.message = `${filePath}: ${err.message}`;
    throw err;
  }

  await Deno.writeFile(filePath, new TextEncoder().encode(contentRaw));
}

/* Writes an object to a JSON file. */
export function writeJsonSync(
  filePath: string,
  object: any,
  options: WriteJsonOption = {}
): void {
  filePath = path.resolve(filePath);

  let contentRaw: string = "";

  try {
    contentRaw = JSON.stringify(
      object,
      options.replacer as string[],
      options.spaces
    );
  } catch (err) {
    err.message = `${filePath}: ${err.message}`;
    throw err;
  }

  Deno.writeFileSync(filePath, new TextEncoder().encode(contentRaw));
}
