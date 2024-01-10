// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { capitalizeWord, splitToWords } from "./_util.ts";

/**
 * Converts a string into camelCase.
 *
 * @example
 * ```ts
 * import { toCamelCase } from "https://deno.land/std@$STD_VERSION/text/case.ts";
 *
 * toCamelCase("deno is awesome"); // "denoIsAwesome"
 * ```
 *
 * @param input The string that is going to be converted into camelCase
 * @returns The string as camelCase
 */
export function toCamelCase(input: string): string {
  input = input.trim();
  const [first = "", ...rest] = splitToWords(input);
  return [first.toLocaleLowerCase(), ...rest.map(capitalizeWord)].join("");
}

/**
 * Converts a string into kebab-case.
 *
 * @example
 * ```ts
 * import { toKebabCase } from "https://deno.land/std@$STD_VERSION/text/case.ts";
 *
 * toKebabCase("deno is awesome"); // "deno-is-awesome"
 * ```
 *
 * @param input The string that is going to be converted into kebab-case
 * @returns The string as kebab-case
 */
export function toKebabCase(input: string): string {
  input = input.trim();
  return splitToWords(input).join("-").toLocaleLowerCase();
}

/**
 * Converts a string into PascalCase.
 *
 * @example
 * ```ts
 * import { toPascalCase } from "https://deno.land/std@$STD_VERSION/text/case.ts";
 *
 * toPascalCase("deno is awesome"); // "DenoIsAwesome"
 * ```
 *
 * @param input The string that is going to be converted into PascalCase
 * @returns The string as PascalCase
 */
export function toPascalCase(input: string): string {
  input = input.trim();
  return splitToWords(input).map(capitalizeWord).join("");
}

/**
 * Converts a string into snake_case.
 *
 * @example
 * ```ts
 * import { toSnakeCase } from "https://deno.land/std@$STD_VERSION/text/case.ts";
 * toSnakeCase("deno is awesome"); // "deno_is_awesome"
 * ```
 *
 * @param input The string that is going to be converted into snake_case
 * @returns The string as snake_case
 */
export function toSnakeCase(input: string): string {
  input = input.trim();
  return splitToWords(input).join("_").toLocaleLowerCase();
}
