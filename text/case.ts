// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { capitalizeWord, split } from "./_util.ts";

/**
 * Converts a string into camelCase.
 *
 * @example
 * ```ts
 * import { toCamelCase } from "https://deno.land/std@$STD_VERSION/text/case.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(toCamelCase("deno is awesome"), "denoIsAwesome");
 * ```
 *
 * @param input The string that is going to be converted into camelCase
 * @returns The string as camelCase
 */
export function toCamelCase(input: string): string {
  const [first = "", ...rest] = split(input);
  return [first.toLocaleLowerCase(), ...rest.map(capitalizeWord)].join("");
}

/**
 * Converts a string into kebab-case
 *
 * @example
 * ```ts
 * import { toKebabCase } from "https://deno.land/std@$STD_VERSION/text/case.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(toKebabCase("deno is awesome"), "deno-is-awesome");
 * ```
 *
 * @param input is the string that is going to be converted into kebab-case
 * @returns The string as kebab-case
 */
export function toKebabCase(input: string): string {
  return split(input).join("-").toLocaleLowerCase();
}

/**
 * Converts a string into PascalCase
 *
 * @example
 * ```ts
 * import { toPascalCase } from "https://deno.land/std@$STD_VERSION/text/case.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(toPascalCase("deno is awesome"), "DenoIsAwesome");
 * ```
 *
 * @param input The string that is going to be converted into PascalCase
 * @returns The string as PascalCase
 */
export function toPascalCase(input: string): string {
  return split(input).map(capitalizeWord).join("");
}

/**
 * Converts a string into SCREAMING_SNAKE_CASE
 *
 * @example
 * ```ts
 * import { toScreamingSnakeCase } from "https://deno.land/std@$STD_VERSION/text/case.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(toScreamingSnakeCase("deno is awesome"), "DENO_IS_AWESOME");
 * ```
 *
 * @param input is the string that is going to be converted into SCREAMING_SNAKE_CASE
 * @returns The string as SCREAMING_SNAKE_CASE
 */
export function toScreamingSnakeCase(input: string): string {
  return toSnakeCase(input).toLocaleUpperCase();
}

/**
 * Converts a string into Sentence case
 *
 * @example
 * ```ts
 * import { toSentenceCase } from "https://deno.land/std@$STD_VERSION/text/case.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 * assertEquals(toSentenceCase("deno is awesome"), "Deno is awesome");
 * ```
 *
 * @param input is the string that is going to be converted into Sentence case
 * @returns The string as Sentence case
 */
export function toSentenceCase(input: string): string {
  const [first = "", ...rest] = split(input);
  return [
    capitalizeWord(first),
    ...rest.map((word) => word.toLocaleLowerCase()),
  ].join(" ");
}

/**
 * Converts a string into snake_case
 *
 * @example
 * ```ts
 * import { toSnakeCase } from "https://deno.land/std@$STD_VERSION/text/case.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 * assertEquals(toSnakeCase("deno is awesome"), "deno_is_awesome");
 * ```
 *
 * @param input is the string that is going to be converted into snake_case
 * @returns The string as snake_case
 */
export function toSnakeCase(input: string): string {
  return split(input).join("_").toLocaleLowerCase();
}

/**
 * Converts a string into Title Case
 *
 * @example
 * ```ts
 * import { toTitleCase } from "https://deno.land/std@$STD_VERSION/text/case.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(toTitleCase("deno is awesome"), "Deno Is Awesome");
 * ```
 *
 * @param input is the string that is going to be converted into Title Case
 * @returns The string as Title Case
 */
export function toTitleCase(input: string): string {
  return split(input).map(capitalizeWord).join(" ");
}
