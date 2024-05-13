// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
// on npm.

/**
 * String formatters and utilities for dealing with ANSI color codes.
 *
 * This module is browser compatible.
 *
 * This module supports `NO_COLOR` environmental variable disabling any coloring
 * if `NO_COLOR` is set.
 *
 * @example
 * ```ts
 * import {
 *   bgBlue,
 *   bgRgb24,
 *   bgRgb8,
 *   bold,
 *   italic,
 *   red,
 *   rgb24,
 *   rgb8,
 * } from "@std/fmt/colors";
 *
 * console.log(bgBlue(italic(red(bold("Hello, World!")))));
 *
 * // also supports 8bit colors
 *
 * console.log(rgb8("Hello, World!", 42));
 *
 * console.log(bgRgb8("Hello, World!", 42));
 *
 * // and 24bit rgb
 *
 * console.log(rgb24("Hello, World!", {
 *   r: 41,
 *   g: 42,
 *   b: 43,
 * }));
 *
 * console.log(bgRgb24("Hello, World!", {
 *   r: 41,
 *   g: 42,
 *   b: 43,
 * }));
 * ```
 *
 * @module
 */

// deno-lint-ignore no-explicit-any
const { Deno } = globalThis as any;
const noColor = typeof Deno?.noColor === "boolean"
  ? Deno.noColor as boolean
  : false;

interface Code {
  open: string;
  close: string;
  regexp: RegExp;
}

const enabled = !noColor;

/**
 * Builds color code
 * @param open
 * @param close
 */
function code(open: number[], close: number): Code {
  return {
    open: `\x1b[${open.join(";")}m`,
    close: `\x1b[${close}m`,
    regexp: new RegExp(`\\x1b\\[${close}m`, "g"),
  };
}

/**
 * Applies color and background based on color code and its associated text
 * @param str text to apply color settings to
 * @param code color code to apply
 */
function run(str: string, code: Code): string {
  return enabled
    ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}`
    : str;
}

/**
 * Make the text bold.
 * @param str text to make bold
 */
export function bold(str: string): string {
  return run(str, code([1], 22));
}

/**
 * Set text color to red.
 * @param str text to make red
 */
export function red(str: string): string {
  return run(str, code([31], 39));
}

/**
 * Set text color to green.
 * @param str text to make green
 */
export function green(str: string): string {
  return run(str, code([32], 39));
}

/**
 * Set text color to white.
 * @param str text to make white
 */
export function white(str: string): string {
  return run(str, code([37], 39));
}

/**
 * Set text color to gray.
 * @param str text to make gray
 */
export function gray(str: string): string {
  return brightBlack(str);
}

/**
 * Set text color to bright black.
 * @param str text to make bright-black
 */
function brightBlack(str: string): string {
  return run(str, code([90], 39));
}

/**
 * Set background color to red.
 * @param str text to make its background red
 */
export function bgRed(str: string): string {
  return run(str, code([41], 49));
}

/**
 * Set background color to green.
 * @param str text to make its background green
 */
export function bgGreen(str: string): string {
  return run(str, code([42], 49));
}

// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new RegExp(
  [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))",
  ].join("|"),
  "g",
);

/**
 * Remove ANSI escape codes from the string.
 *
 * @param string to remove ANSI escape codes from
 */
export function stripAnsiCode(string: string): string {
  return string.replace(ANSI_PATTERN, "");
}
