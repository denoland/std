// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/**
 * Read file synchronously and output it as a string.
 *
 * @param filename File to read
 * @param encoding Encoding of the file
 */
export function readFileStrSync(filename: string, encoding: string): string {
  const decoder = new TextDecoder(encoding);
  return decoder.decode(Deno.readFileSync(filename));
}

/**
 * Read file and output it as a string.
 *
 * @param filename File to read
 * @param encoding Encoding of the file
 */
export async function readFileStr(
  filename: string,
  encoding: string
): Promise<string> {
  const decoder = new TextDecoder(encoding);
  return decoder.decode(await Deno.readFile(filename));
}
