// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import * as path from "./path/mod.ts";

interface WriteJsonOption {
  spaces?: number | string;
  replacer?: (number | string)[] | null | Replacer;
}

type Replacer = (key: string, value: any) => any;

/**
 * Writes an object to a JSON file.
 * @export
 * @param {string} filePath
 * @param {*} object
 * @param {WriteJsonOption} [options]
 * @returns {Promise<void>}
 */
export async function writeJson(
  filePath: string,
  object: any,
  options?: WriteJsonOption
): Promise<void> {
  filePath = path.resolve(filePath);

  let contentRaw: string = "";

  try {
    if (options) {
      contentRaw = JSON.stringify(
        object,
        (options.replacer as string[]) || null,
        options.spaces
      );
    } else {
      contentRaw = JSON.stringify(object);
    }
  } catch (err) {
    err.message = `${filePath}: ${err.message}`;
    throw err;
  }

  await Deno.writeFile(filePath, new TextEncoder().encode(contentRaw));
}

/**
 * Writes an object to a JSON file.
 * @export
 * @param {string} filePath
 * @param {*} object
 * @param {WriteJsonOption} [options]
 * @returns {void}
 */
export function writeJsonSync(
  filePath: string,
  object: any,
  options?: WriteJsonOption
): void {
  filePath = path.resolve(filePath);

  let contentRaw: string = "";

  try {
    if (options) {
      contentRaw = JSON.stringify(
        object,
        (options.replacer as string[]) || null,
        options.spaces
      );
    } else {
      contentRaw = JSON.stringify(object);
    }
  } catch (err) {
    err.message = `${filePath}: ${err.message}`;
    throw err;
  }

  Deno.writeFileSync(filePath, new TextEncoder().encode(contentRaw));
}
