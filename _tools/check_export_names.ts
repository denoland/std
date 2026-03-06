// deno-lint-ignore-file no-console
// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * This script adds kebab case checking for export names found in each `@std`
 * package's `deno.json` `exports` property.
 *
 * Run using: deno run -A _tools/check_export_names.ts
 */

import denoJson from "../deno.json" with { type: "json" };
import { join, parse } from "@std/path";
import { toKebabCase } from "@std/text";

const IGNORE_KEBAB_CASE_WORDS = [
  "ascii85",
  "base32",
  "base58",
  "base64",
  "base64url",
  "v1",
  "v3",
  "v4",
  "v5",
  "v6",
  "v7",
  "2d",
];

function isExportInKebabCase(name: string): boolean {
  const ignoreWords = IGNORE_KEBAB_CASE_WORDS
    .filter((word) => name.includes(word));
  if (ignoreWords.length !== 0) {
    // Sort words by the longest string.
    ignoreWords.sort((aWord, bWord) => bWord.length - aWord.length);
    let copyName = name;
    // Replace words with a single "x" to satisfy a well-formed kebab.
    for (const word of ignoreWords) {
      const re = new RegExp(word);
      copyName = copyName.replace(re, "x");
    }

    // Checks kebab casing with "ignore" words replaced with an "x".
    if (copyName !== toKebabCase(copyName)) {
      return false;
    }
  } else {
    if (name !== toKebabCase(name)) {
      return false;
    }
  }
  return true;
}

// Provides a suggestion to developers on what kebab export name to use if
// linting fails.
function suggestKebabName(name: string): string {
  const ignoreWords = IGNORE_KEBAB_CASE_WORDS
    .filter((word) => name.includes(word));

  // If "ignore" words are present, suggest a kebab case name with "ignore" word
  // format preserved.
  if (ignoreWords.length !== 0) {
    ignoreWords.sort((aWord, bWord) => bWord.length - aWord.length);

    const kebabPadTable: Record<string, string> = {};
    const replaceTable: Record<string, string> = {};
    ignoreWords.forEach((word) => {
      const padWord = "".concat(" ", toKebabCase(word), " ");
      kebabPadTable[toKebabCase(word)] = padWord;
      replaceTable[toKebabCase(word)] = word;
    });

    let suggestion = toKebabCase(name);
    for (const [kebab, padWord] of Object.entries(kebabPadTable)) {
      const re = new RegExp(kebab);
      suggestion = suggestion.replace(re, padWord);
    }
    // The `padWord` helps delimit `name` such that "ignore" words are
    // prioritized when kebab'd.
    suggestion = toKebabCase(suggestion);
    for (const [kebab, word] of Object.entries(replaceTable)) {
      const re = new RegExp(kebab);
      suggestion = suggestion.replace(re, word);
    }

    return suggestion;
  }

  // Default condition when no "ignore" words are present.
  return toKebabCase(name);
}

const denoJsonList = Promise.all(
  denoJson.workspace.map((w) =>
    Deno.readTextFile(join(w, "deno.json")).then(JSON.parse)
  ),
);

let failed = false;

for (const denoJson of await denoJsonList) {
  const namedExports = Array.from(Object.keys(denoJson.exports))
    .filter((name) => name !== ".");

  for (const pathName of namedExports) {
    const { name } = parse(pathName);

    if (!isExportInKebabCase(name)) {
      console.warn(
        `.${
          denoJson.name.slice(4)
        }/deno.json: export name is not in kebab case or contains an invalid "ignore" word:\n\tFound export name: "${name}"\n\tSuggested export name: "${
          suggestKebabName(name)
        }"`,
      );
      failed = true;
    }
  }
}

if (failed) {
  console.warn(
    `NOTE: If part of a name needs to be preserved (not "kebab'd") because it's related to a new encoding (e.g. "base64") or uuid version (e.g. "v1"), that word can be added to the IGNORE_KEBAB_CASE_WORDS array in "_tools/check_export_names.ts".`,
  );
  Deno.exit(1);
}

console.log("ok");
