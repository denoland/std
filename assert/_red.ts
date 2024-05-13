// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// This code was vendored from `fmt/colors.ts`.

// deno-lint-ignore no-explicit-any
const { Deno } = globalThis as any;
const noColor = typeof Deno?.noColor === "boolean"
  ? Deno.noColor as boolean
  : false;

const enabled = !noColor;

interface Code {
  open: string;
  close: string;
  regexp: RegExp;
}

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
 * Set text color to red.
 * @param str text to make red
 */
export function red(str: string): string {
  return run(str, code([31], 39));
}
