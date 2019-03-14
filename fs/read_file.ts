// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

export interface ReadOptions {
  encoding?: string;
}

/**
 * Read file synchronously and output it as a string.
 *
 * @param filename File to read
 * @param opts Read options
 */
export function readFileSync(filename: string, opts: ReadOptions = {}): string {
  const decoder = new TextDecoder(opts.encoding);
  return decoder.decode(Deno.readFileSync(filename));
}

/**
 * Read file and output it as a string.
 *
 * @param filename File to read
 * @param opts Read options
 */
export async function readFile(
  filename: string,
  opts: ReadOptions = { }
): Promise<string> {
  const decoder = new TextDecoder(opts.encoding);
  return decoder.decode(await Deno.readFile(filename));
}
