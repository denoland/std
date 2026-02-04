// Copyright 2018-2026 the Deno authors. MIT license.

export function extractFrontMatter(
  input: string,
  extractRegExp: RegExp,
): { frontMatter: string; body: string } {
  const groups = extractRegExp.exec(input)?.groups;
  if (!groups) throw new TypeError("Unexpected end of input");
  const { frontMatter = "", body = "" } = groups;
  return { frontMatter, body };
}
