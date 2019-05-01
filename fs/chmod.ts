// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { exists, existsSync } from "./exists.ts";

/**
 * Change permission of a file or directory specified at the path asynchronously
 *
 * @param path path of the file to change permission
 * @param mode permission to change to
 */
export async function chmod(
  path: string,
  mode: number
): Promise<void> {
  if (!(await exists(path))) {
    throw new Error("No such file or directory specified at path.");
  }
  await Deno.chmod(path, mode);
}

/**
 * Change permission of a file or directory specified at the path synchronously
 *
 * @param path path of the file to change permission
 * @param mode permission to change to
 */
export function chmodSync(
  path: string,
  mode: number
): void {
  if (!existsSync(path)) {
    throw new Error("No such file or directory specified at path.")
  }
  Deno.chmodSync(path, mode);
}
