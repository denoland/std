const nameStartChar =
  ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
const nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
const nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
const regexName = new RegExp("^" + nameRegexp + "$");

export function isWhiteSpace(char: string) {
  return char === " " || char === "\t" || char === "\n" || char === "\r";
}

export function isValidName(name: string) {
  return regexName.test(name);
}

export function getPosition(input: string, i: number): string {
  const lines = input.slice(0, i).split("\n");
  const line = lines.length;
  const column = lines.at(-1)?.length ?? 0;
  return `${line}:${column}`;
}

export function whiteSpaceCleaner(
  input: string,
  i: number,
  atLeastOne = false
): number {
  if (atLeastOne) {
    if (!isWhiteSpace(input[i])) {
      throw new Error(`Illegal character "${input[i]}", expected whitespace`);
    }
  }

  while (isWhiteSpace(input[i])) {
    i++;
  }

  return i;
}
