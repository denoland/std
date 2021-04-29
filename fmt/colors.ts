// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
// on npm.
//
// ```
// import { bgBlue, red, bold } from "https://deno.land/std/fmt/colors.ts";
// console.log(bgBlue(red(bold("Hello world!"))));
// ```
//
// This module supports `NO_COLOR` environmental variable disabling any coloring
// if `NO_COLOR` is set.
//
// This module is browser compatible.

const noColor = globalThis.Deno?.noColor ?? true;

interface Code {
  open: string;
  close: string;
  regexp: RegExp;
}

/** RGB 8-bits per channel. Each in range `0->255` or `0x00->0xff` */
interface Rgb {
  r: number;
  g: number;
  b: number;
}

let enabled = !noColor;

/**
 * Creates a function that will generate a function that allows it to be used
 * as a tagged template or as a regular function
 * @param f the string mapping function
 * @returns the generated function
 */
function createOptionalTagger(f: (s: string) => string) {
  return (
    str: TemplateStringsArray | string,
    // deno-lint-ignore no-explicit-any
    ...params: any[]
  ) => {
    if (typeof str === "string") {
      return f(str);
    }

    const strings = str;
    const result = [];

    for (let i = 0; i < Math.max(strings.length, params.length); i++) {
      if (strings[i] !== undefined) result.push(strings[i]);
      if (params[i] !== undefined) result.push(params[i]);
    }

    return f(result.join(""));
  };
}

/**
 * Set changing text color to enabled or disabled
 * @param value
 */
export function setColorEnabled(value: boolean): void {
  if (noColor) {
    return;
  }

  enabled = value;
}

/** Get whether text color change is enabled or disabled. */
export function getColorEnabled(): boolean {
  return enabled;
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
 * Reset the text modified
 * @param str text to reset
 */
export const reset = createOptionalTagger((str) => run(str, code([0], 0)));

/**
 * Make the text bold.
 * @param str text to make bold
 */
export const bold = createOptionalTagger((str) => run(str, code([1], 22)));

/**
 * The text emits only a small amount of light.
 * @param str text to dim
 */
export const dim = createOptionalTagger((str) => run(str, code([2], 22)));

/**
 * Make the text italic.
 * @param str text to make italic
 */
export const italic = createOptionalTagger((str) => run(str, code([3], 23)));

/**
 * Make the text underline.
 * @param str text to underline
 */
export const underline = createOptionalTagger((str) => run(str, code([4], 24)));

/**
 * Invert background color and text color.
 * @param str text to invert its color
 */
export const inverse = createOptionalTagger((str) => run(str, code([7], 27)));

/**
 * Make the text hidden.
 * @param str text to hide
 */
export const hidden = createOptionalTagger((str) => run(str, code([8], 28)));

/**
 * Put horizontal line through the center of the text.
 * @param str text to strike through
 */
export const strikethrough = createOptionalTagger((str) =>
  run(str, code([9], 29))
);

/**
 * Set text color to black.
 * @param str text to make black
 */
export const black = createOptionalTagger((str) => run(str, code([30], 39)));

/**
 * Set text color to red.
 * @param str text to make red
 */
export const red = createOptionalTagger((str) => run(str, code([31], 39)));

/**
 * Set text color to green.
 * @param str text to make green
 */
export const green = createOptionalTagger((str) => run(str, code([32], 39)));

/**
 * Set text color to yellow.
 * @param str text to make yellow
 */
export const yellow = createOptionalTagger((str) => run(str, code([33], 39)));

/**
 * Set text color to blue.
 * @param str text to make blue
 */
export const blue = createOptionalTagger((str) => run(str, code([34], 39)));

/**
 * Set text color to magenta.
 * @param str text to make magenta
 */
export const magenta = createOptionalTagger((str) => run(str, code([35], 39)));

/**
 * Set text color to cyan.
 * @param str text to make cyan
 */
export const cyan = createOptionalTagger((str) => run(str, code([36], 39)));

/**
 * Set text color to white.
 * @param str text to make white
 */
export const white = createOptionalTagger((str) => run(str, code([37], 39)));

/**
 * Set text color to bright black.
 * @param str text to make bright-black
 */
export const brightBlack = createOptionalTagger((str) =>
  run(str, code([90], 39))
);

/**
 * Set text color to gray.
 * @param str text to make gray
 */
export const gray = brightBlack;

/**
 * Set text color to bright red.
 * @param str text to make bright-red
 */
export const brightRed = createOptionalTagger((str) =>
  run(str, code([91], 39))
);

/**
 * Set text color to bright green.
 * @param str text to make bright-green
 */
export const brightGreen = createOptionalTagger((str) =>
  run(str, code([92], 39))
);

/**
 * Set text color to bright yellow.
 * @param str text to make bright-yellow
 */
export const brightYellow = createOptionalTagger((str) =>
  run(str, code([93], 39))
);

/**
 * Set text color to bright blue.
 * @param str text to make bright-blue
 */
export const brightBlue = createOptionalTagger((str) =>
  run(str, code([94], 39))
);

/**
 * Set text color to bright magenta.
 * @param str text to make bright-magenta
 */
export const brightMagenta = createOptionalTagger((str) =>
  run(str, code([95], 39))
);

/**
 * Set text color to bright cyan.
 * @param str text to make bright-cyan
 */
export const brightCyan = createOptionalTagger((str) =>
  run(str, code([96], 39))
);

/**
 * Set text color to bright white.
 * @param str text to make bright-white
 */
export const brightWhite = createOptionalTagger((str) =>
  run(str, code([97], 39))
);

/**
 * Set background color to black.
 * @param str text to make its background black
 */
export const bgBlack = createOptionalTagger((str) => run(str, code([40], 49)));

/**
 * Set background color to red.
 * @param str text to make its background red
 */
export const bgRed = createOptionalTagger((str) => run(str, code([41], 49)));

/**
 * Set background color to green.
 * @param str text to make its background green
 */
export const bgGreen = createOptionalTagger((str) => run(str, code([42], 49)));

/**
 * Set background color to yellow.
 * @param str text to make its background yellow
 */
export const bgYellow = createOptionalTagger((str) => run(str, code([43], 49)));

/**
 * Set background color to blue.
 * @param str text to make its background blue
 */
export const bgBlue = createOptionalTagger((str) => run(str, code([44], 49)));

/**
 *  Set background color to magenta.
 * @param str text to make its background magenta
 */
export const bgMagenta = createOptionalTagger((str) =>
  run(str, code([45], 49))
);

/**
 * Set background color to cyan.
 * @param str text to make its background cyan
 */
export const bgCyan = createOptionalTagger((str) => run(str, code([46], 49)));

/**
 * Set background color to white.
 * @param str text to make its background white
 */
export const bgWhite = createOptionalTagger((str) => run(str, code([47], 49)));

/**
 * Set background color to bright black.
 * @param str text to make its background bright-black
 */
export const bgBrightBlack = createOptionalTagger((str) =>
  run(str, code([100], 49))
);

/**
 * Set background color to bright red.
 * @param str text to make its background bright-red
 */
export const bgBrightRed = createOptionalTagger((str) =>
  run(str, code([101], 49))
);

/**
 * Set background color to bright green.
 * @param str text to make its background bright-green
 */
export const bgBrightGreen = createOptionalTagger((str) =>
  run(str, code([102], 49))
);

/**
 * Set background color to bright yellow.
 * @param str text to make its background bright-yellow
 */
export const bgBrightYellow = createOptionalTagger((str) =>
  run(str, code([103], 49))
);

/**
 * Set background color to bright blue.
 * @param str text to make its background bright-blue
 */
export const bgBrightBlue = createOptionalTagger((str) =>
  run(str, code([104], 49))
);

/**
 * Set background color to bright magenta.
 * @param str text to make its background bright-magenta
 */
export const bgBrightMagenta = createOptionalTagger((str) =>
  run(str, code([105], 49))
);

/**
 * Set background color to bright cyan.
 * @param str text to make its background bright-cyan
 */
export const bgBrightCyan = createOptionalTagger((str) =>
  run(str, code([106], 49))
);

/**
 * Set background color to bright white.
 * @param str text to make its background bright-white
 */
export const bgBrightWhite = createOptionalTagger((str) =>
  run(str, code([107], 49))
);

/* Special Color Sequences */

/**
 * Clam and truncate color codes
 * @param n
 * @param max number to truncate to
 * @param min number to truncate from
 */
function clampAndTruncate(n: number, max = 255, min = 0): number {
  return Math.trunc(Math.max(Math.min(n, max), min));
}

/**
 * Set text color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit colors to
 * @param color code
 */
export function rgb8(str: string, color: number): string {
  return run(str, code([38, 5, clampAndTruncate(color)], 39));
}

/**
 * Set background color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit background colors to
 * @param color code
 */
export function bgRgb8(str: string, color: number): string {
  return run(str, code([48, 5, clampAndTruncate(color)], 49));
}

/**
 * Set text color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 *      rgb24("foo", 0xff00ff);
 *      rgb24("foo", {r: 255, g: 0, b: 255});
 * @param str text color to apply 24bit rgb to
 * @param color code
 */
export function rgb24(str: string, color: number | Rgb): string {
  if (typeof color === "number") {
    return run(
      str,
      code([38, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff], 39)
    );
  }
  return run(
    str,
    code(
      [
        38,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b),
      ],
      39
    )
  );
}

/**
 * Set background color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 *      bgRgb24("foo", 0xff00ff);
 *      bgRgb24("foo", {r: 255, g: 0, b: 255});
 * @param str text color to apply 24bit rgb to
 * @param color code
 */
export function bgRgb24(str: string, color: number | Rgb): string {
  if (typeof color === "number") {
    return run(
      str,
      code([48, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff], 49)
    );
  }
  return run(
    str,
    code(
      [
        48,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b),
      ],
      49
    )
  );
}

// https://github.com/chalk/ansi-regex/blob/2b56fb0c7a07108e5b54241e8faec160d393aedb/index.js
const ANSI_PATTERN = new RegExp(
  [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
  ].join("|"),
  "g"
);

/**
 * Remove ANSI escape codes from the string.
 * @param string to remove ANSI escape codes from
 */
export function stripColor(string: string): string {
  return string.replace(ANSI_PATTERN, "");
}
