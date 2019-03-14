// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/**
 * Read file synchronously and output it as a string.
 *
 * @param filename File to read
 * @param [encoding="utf-8"] encoding Encoding of the file
 */
export function readFileStrSync(
  filename: string,
  encoding: string = "utf-8"
): string {
  const decoder = new TextDecoder(encoding);
  return decoder.decode(Deno.readFileSync(filename));
}

/**
 * Read file and output it as a string.
 *
 * @param filename File to read
 * @param [encoding="utf-8"] Encoding of the file
 */
export async function readFileStr(
  filename: string,
  encoding: string = "utf-8"
): Promise<string> {
  const decoder = new TextDecoder(encoding);
  return decoder.decode(await Deno.readFile(filename));
}
