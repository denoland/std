// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Converts a str into PascalCase
 *
 * @example
 * ```ts
 * import {
 *  toPascalCase,
 * } from "https://deno.land/std@$STD_VERSION/fmt/case.ts";
 * import {
 *   assertEquals,
 * } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(toPascalCase("deno is awesome"), "DenoIsAwesome");
 * ```
 *
 * @param str The string that is going to be converted into PascalCase
 * @returns The string as PascalCase
 */
export function toPascalCase(str: string): string {
  if (typeof str !== "string") {
    throw new TypeError("str must be a string");
  }

  if (str === "") {
    return "";
  }

  return str.split(" ").map(capitalizeWord).join("");
}

/**
 * Converts a str into camelCase
 *
 * @example
 * ```ts
 * import {
 *  toCamelCase,
 * } from "https://deno.land/std@$STD_VERSION/fmt/case.ts";
 * import {
 *   assertEquals,
 * } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(toCamelCase("deno is awesome"), "denoIsAwesome");
 * ```
 *
 * @param str The string that is going to be converted into camelCase
 * @returns The string as camelCase
 */
export function toCamelCase(str: string): string {
  if (typeof str !== "string") {
    throw new TypeError("str must be a string");
  }

  if (str === "") {
    return "";
  }

  const [firstWord, ...restOfWords] = str.split(" ");
  return [firstWord, restOfWords.map(capitalizeWord)].flat(1).join("");
}

function capitalizeWord(word: string): string {
  const firstChar = word[0];
  const firstCharAsUpperCase = firstChar.toLocaleUpperCase();
  const restOfTheString = word.slice(1).toLocaleLowerCase();
  return firstCharAsUpperCase + restOfTheString;
}

/**
 * Converts a str into snake_case
 *
 * @example
 * ```ts
 * import {
 *   toSnakeCase,
 * } from "https://deno.land/std@$STD_VERSION/fmt/case.ts";
 * assertEquals(toSnakeCase("deno is awesome"), "deno_is_awesome");
 * ```
 * import {
 *   assertEquals,
 * } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * @param str is the string that is going to be converted into snake_case
 * @returns The string as snake_case
 */
export function toSnakeCase(str: string): string {
  if (typeof str !== "string") {
    throw new TypeError("str must be a string");
  }

  if (str === "") {
    return "";
  }

  return str.split(" ").join("_").toLocaleLowerCase();
}

/**
 * Converts a str into SCREAMING_SNAKE_CASE
 *
 * @example
 * ```ts
 * import {
 *   toScreamingSnakeCase,
 * } from "https://deno.land/std@$STD_VERSION/fmt/case.ts";
 * import {
 *   assertEquals,
 * } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 * 
 * assertEquals(toScreamingSnakeCase("deno is awesome"), "DENO_IS_AWESOME");
 * ```
 *
 * @param str is the string that is going to be converted into SCREAMING_SNAKE_CASE
 * @returns The string as SCREAMING_SNAKE_CASE
 */
export function toScreamingSnakeCase(str: string): string {
  return toSnakeCase(str).toLocaleUpperCase();
}

/**
 * Converts a str into kebab-case
 *
 * @example
 * ```ts
 * import {
 *   toKebabCase,
 * } from "https://deno.land/std@$STD_VERSION/fmt/case.ts";
 * import {
 *   assertEquals,
 * } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 * 
 * assertEquals(toKebabCase("deno is awesome"), "deno-is-awesome");
 * ```
 *
 * @param str is the string that is going to be converted into kebab-case
 * @returns The string as kebab-case
 */
export function toKebabCase(str: string): string {
  if (typeof str !== "string") {
    throw new TypeError("str must be a string");
  }

  if (str === "") {
    return "";
  }

  return str.split(" ").join("-").toLocaleLowerCase();
}

/**
 * Converts a str into Title Case
 *
 * @example
 * ```ts
 * import {
 *   toTitleCase,
 * } from "https://deno.land/std@$STD_VERSION/fmt/case.ts";
 * import {
 *   assertEquals,
 * } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 * 
 * assertEquals(toTitleCase("deno is awesome"), "Deno Is Awesome");
 * ```
 *
 * @param str is the string that is going to be converted into Title Case
 * @returns The string as Title Case
 */
export function toTitleCase(str: string): string {
  if (typeof str !== "string") {
    throw new TypeError("str must be a string");
  }

  if (str === "") {
    return "";
  }

  return str.split(" ")
    .map(capitalizeWord)
    .join(" ");
}
