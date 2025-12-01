// Copyright 2018-2025 the Deno authors. MIT license.

type LineParseResult = {
  key: string;
  unquoted: string;
  interpolated: string;
  notInterpolated: string;
};

type CharactersMap = { [key: string]: string };

const KEY_VALUE_REGEXP =
  /^\s*(?:export\s+)?(?<key>[^\s=#]+?)\s*=[\ \t]*('\r?\n?(?<notInterpolated>(.|\r\n|\n)*?)\r?\n?'|"\r?\n?(?<interpolated>(.|\r\n|\n)*?)\r?\n?"|(?<unquoted>[^\r\n#]*)) *#*.*$/gm;

const VALID_KEY_REGEXP = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const EXPAND_VALUE_REGEXP =
  /(\${(?<inBrackets>.+?)(\:-(?<inBracketsDefault>.+))?}|(?<!\\)\$(?<notInBrackets>\w+)(\:-(?<notInBracketsDefault>.+))?)/g;

function expandCharacters(str: string): string {
  const charactersMap: CharactersMap = {
    "\\n": "\n",
    "\\r": "\r",
    "\\t": "\t",
  };

  return str.replace(
    /\\([nrt])/g,
    ($1: keyof CharactersMap): string => charactersMap[$1] ?? "",
  );
}

function expand(str: string, variablesMap: { [key: string]: string }): string {
  if (EXPAND_VALUE_REGEXP.test(str)) {
    return expand(
      str.replace(EXPAND_VALUE_REGEXP, function (...params) {
        const {
          inBrackets,
          inBracketsDefault,
          notInBrackets,
          notInBracketsDefault,
        } = params[params.length - 1];
        const expandValue = inBrackets || notInBrackets;
        const defaultValue = inBracketsDefault || notInBracketsDefault;

        let value: string | undefined = variablesMap[expandValue];
        if (value === undefined) {
          value = Deno.env.get(expandValue);
        }
        return value === undefined ? expand(defaultValue, variablesMap) : value;
      }),
      variablesMap,
    );
  } else {
    return str;
  }
}

/**
 * Parse `.env` file output in an object.
 *
 * Note: The key needs to match the pattern /^[a-zA-Z_][a-zA-Z0-9_]*$/.
 *
 * @example Usage
 * ```ts
 * import { parse } from "@std/dotenv/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const env = parse("GREETING=hello world");
 * assertEquals(env, { GREETING: "hello world" });
 * ```
 *
 * @param text The text to parse.
 * @returns The parsed object.
 */
export function parse(text: string): Record<string, string> {
  const env: Record<string, string> = Object.create(null);

  const keysForExpandCheck = [];

  for (const match of text.matchAll(KEY_VALUE_REGEXP)) {
    const { key, interpolated, notInterpolated, unquoted } = match
      ?.groups as LineParseResult;

    if (!VALID_KEY_REGEXP.test(key)) {
      // deno-lint-ignore no-console
      console.warn(
        `Ignored the key "${key}" as it is not a valid identifier: The key need to match the pattern /^[a-zA-Z_][a-zA-Z0-9_]*$/.`,
      );
      continue;
    }

    if (unquoted) {
      keysForExpandCheck.push(key);
    }

    env[key] = typeof notInterpolated === "string"
      ? notInterpolated
      : typeof interpolated === "string"
      ? expandCharacters(interpolated)
      : unquoted.trim();
  }

  //https://github.com/motdotla/dotenv-expand/blob/ed5fea5bf517a09fd743ce2c63150e88c8a5f6d1/lib/main.js#L23
  const variablesMap = { ...env };

  for (const key of keysForExpandCheck) {
    env[key] = expand(env[key]!, variablesMap);
  }

  return env;
}
