// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
// It should have its own interface in case there will be new option field in the future
/* eslint-disable-next-line @typescript-eslint/no-empty-interface */
export interface RemoveOptions extends Deno.RemoveOption {}

/* Removes the named file or directory. alias for `Deno.remove` */
export async function remove(
  path: string,
  options: RemoveOptions = {}
): Promise<void> {
  await Deno.remove(path, options);
}

/* Removes the named file or directory synchronously. alias for `Deno.removeSync` */
export function removeSync(path: string, options: RemoveOptions = {}): void {
  Deno.removeSync(path, options);
}
