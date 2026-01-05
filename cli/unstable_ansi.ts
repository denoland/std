// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Ansi is a module that offers export function s and variables that returns
 * various Ansi Escape Sequences. This class is not an exhaustive list of what
 * is possible with Ansi Escape Sequences, nor does it guarantee that every
 * code will work in every terminal. The only way to guarantee that only one
 * code will work in a particular terminal, is to check for yourself. Calling
 * these export function s and variables does not automatically change the
 * terminal settings. Only once they are passed to stdout or stderr will they
 * take effect.
 *
 * These codes were based off the
 * [xterm reference](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html).
 *
 * @example Basic Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.DOUBLE_HEIGHT_TOP + "Hello World!");
 * console.log(Ansi.DOUBLE_HEIGHT_BOTTOM + "Hello World!");
 * ```
 *
 * @module
 */

/**
 * Causes content on the current line to enlarge, showing only the top half
 * of characters with each character taking up two columns. Can be used in
 * combination with {@linkcode DOUBLE_HEIGHT_BOTTOM} on the next line to
 * make text appear twice as big.
 *
 * @returns The ANSI escape code for double-height top.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.DOUBLE_HEIGHT_TOP + "Hello World!");
 * console.log(Ansi.DOUBLE_HEIGHT_BOTTOM + "Hello World!");
 * ```
 */
export const DOUBLE_HEIGHT_TOP = "\x1b#3";

/**
 * Causes content on the current line to enlarge, showing only the bottom
 * half of the characters with each character taking up two columns. Can be
 * used in combination with {@linkcode DOUBLE_HEIGHT_TOP} on the previous
 * line to make text appear twice as big.
 *
 * @returns The ANSI escape code for double-height bottom.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.DOUBLE_HEIGHT_TOP + "Hello World!");
 * console.log(Ansi.DOUBLE_HEIGHT_BOTTOM + "Hello World!");
 * ```
 */
export const DOUBLE_HEIGHT_BOTTOM = "\x1b#4";

/**
 * Causes content on the current line to shrink down to a single column,
 * essentially reverting the effects of {@linkcode DOUBLE_HEIGHT_TOP},
 * {@linkcode DOUBLE_HEIGHT_BOTTOM}, or {@linkcode DOUBLE_WIDTH}.
 *
 * @returns The ANSI escape code for single-width.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.DOUBLE_HEIGHT_TOP + "Hello World!");
 * console.log(Ansi.DOUBLE_HEIGHT_BOTTOM + "Hello World!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUpStart(2) +
 *     Ansi.deleteLines(1) +
 *     Ansi.SINGLE_WIDTH,
 * );
 * ```
 */
export const SINGLE_WIDTH = "\x1b#5";

/**
 * Causes content on the current line to stretch out, with each character
 * taking up two columns. Can be reverted with {@linkcode SINGLE_WIDTH}.
 *
 * @returns The ANSI escape code for double-width.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.DOUBLE_WIDTH + "Hello World!");
 * ```
 */
export const DOUBLE_WIDTH = "\x1b#6";

/**
 * Saves:
 * - cursor position
 * - graphic rendition
 * - character set shift state
 * - state of wrap flag {@linkcode ENABLE_AUTO_WRAP}
 * - state of origin mode {@linkcode ENABLE_ORIGIN_MODE}
 * - selective eraser
 *
 * Can be restored with {@linkcode RESTORE_CURSOR}.
 *
 * @returns The ANSI escape code for saving cursor.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(
 *   Ansi.SAVE_CURSOR +
 *     Ansi.setCursorPosition(Deno.consoleSize().rows, 1) +
 *     Ansi.ERASE_LINE +
 *     "Hello World!" +
 *     Ansi.RESTORE_CURSOR,
 * );
 * ```
 */
export const SAVE_CURSOR = "\x1b7";

/**
 * Restores:
 * - cursor position
 * - graphic rendition
 * - character set shift state
 * - state of wrap flag {@linkcode ENABLE_AUTO_WRAP}
 * - state of origin mode {@linkcode ENABLE_ORIGIN_MODE}
 * - selective eraser
 *
 * Can be saved with {@linkcode SAVE_CURSOR}.
 *
 * @returns The ANSI escape code for restoring cursor.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(
 *   Ansi.SAVE_CURSOR +
 *     Ansi.setCursorPosition(Deno.consoleSize().rows) +
 *     Ansi.ERASE_LINE +
 *     "Hello World!" +
 *     Ansi.RESTORE_CURSOR,
 * );
 * ```
 */
export const RESTORE_CURSOR = "\x1b8";

/**
 * This is a full reset of the terminal, reverting it back to its original
 * default settings, clearing the screen, resetting modes, colors, character
 * sets and more. Essentially making the terminal behave as if it were just
 * started by the user. This command is very disruptive to the user. Also see
 * {@linkcode SOFT_RESET}.
 *
 * @returns The ANSI escape code for hard resetting the terminal.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.HIDE_CURSOR);
 * await delay(5000);
 * console.log(Ansi.HARD_RESET);
 * ```
 */
export const HARD_RESET = "\x1bc";

/**
 * This command resets many settings to their initial state without fully
 * reinitializing the terminal like {@linkcode HARD_RESET}. It preserves
 * things like cursor position and display content, but clears modes,
 * character sets, etc. Should probably be called when exiting the program.
 *
 * @returns The ANSI escape code for soft resetting the terminal.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.HIDE_CURSOR);
 * await delay(5000);
 * console.log(Ansi.SOFT_RESET);
 * ```
 */
export const SOFT_RESET = "\x1b[!p";

/**
 * Inserts `x` spaces at the cursor position. Shifting existing line content
 * to the right. Cursor position does not change. Characters that exit the
 * display are discarded.
 *
 * @param x The number of spaces to insert.
 * @returns The ANSI escape code for inserting spaces.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUp() +
 *     Ansi.setCursorColumn(6) +
 *     Ansi.insertSpace(10),
 * );
 * ```
 */
export function insertSpace(x = 1): string {
  return `\x1b[${x}@`;
}

/**
 * Deletes `x` characters at cursor position and to the right. Shifting line
 * content left.
 *
 * @param x The number of characters to delete.
 * @returns The ANSI escape code for deleting characters.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUpStart() +
 *     Ansi.deleteCharacters(5) +
 *     "Bye",
 * );
 * ```
 */
export function deleteCharacters(x = 1): string {
  return `\x1b[${x}P`;
}

/**
 * Erases `x` characters at cursor position and to the right.
 *
 * @param x The number of characters to erase.
 * @returns The ANSI escape code for erasing characters.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUp() +
 *     Ansi.setCursorColumn(7) +
 *     Ansi.eraseCharacters(6) +
 *     "Bob!",
 * );
 * ```
 */
export function eraseCharacters(x = 1): string {
  return `\x1b[${x}X`;
}

/**
 * Inserts `x` lines at cursor position. Shifting current line and below
 * down. Cursor position does not change. Characters that exit the display
 * are discarded.
 *
 * @param x The number of lines to insert.
 * @returns The ANSI escape code for inserting lines.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello\nWorld!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUpStart() +
 *     Ansi.insertLines() +
 *     "and Goodbye",
 * );
 * ```
 */
export function insertLines(x = 1): string {
  return `\x1b[${x}L`;
}

/**
 * Deletes `x` lines at cursor position. Shifting below lines up.
 *
 * @param x The number of lines to delete.
 * @returns The ANSI escape code for deleting lines.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello\nWorld!");
 * await delay(1000);
 * console.log(Ansi.moveCursorUpStart() + Ansi.deleteLines());
 * await delay(1000);
 * console.log("and Goodbye!");
 * ```
 */
export function deleteLines(x = 1): string {
  return `\x1b[${x}M`;
}

/**
 * Moves cursor position up `x` lines or up to the top margin.
 *
 * @param x The number of lines to move up.
 * @returns The ANSI escape code for moving the cursor up.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello\nWorld!");
 * await delay(1000);
 * console.log(Ansi.moveCursorUp(2) + "Goodbye");
 * ```
 */
export function moveCursorUp(x = 1): string {
  return `\x1b[${x}A`;
}

/**
 * Moves cursor position `x` lines up or up to the top of the margin, and to
 * the beginning of that line.
 *
 * @param x The number of lines to move up.
 * @returns The ANSI escape code for moving the cursor up and to the
 * beginning of the line.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello\nWorld!");
 * await delay(1000);
 * console.log(Ansi.moveCursorUpStart(2) + "Goodbye");
 * ```
 */
export function moveCursorUpStart(x = 1): string {
  return `\x1b[${x}F`;
}

/**
 * Moves cursor position down `x` lines or up to the bottom margin.
 *
 * @param x The number of lines to move down.
 * @returns The ANSI escape code for moving the cursor down.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello\nWorld!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUpStart(2) +
 *     "Goodbye" +
 *     Ansi.moveCursorDown() +
 *     Ansi.setCursorColumn() +
 *     Ansi.ERASE_LINE +
 *     "Bob!",
 * );
 * ```
 */
export function moveCursorDown(x = 1): string {
  return `\x1b[${x}B`;
}

/**
 * Moves cursor position `x` lines down or up to the bottom margin, and to
 * the beginning of that line.
 *
 * @param x The number of lines to move down.
 * @returns The ANSI escape code for moving the cursor down and to the
 * beginning of the line.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello\nWorld!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUpStart(2) +
 *     "Goodbye" +
 *     Ansi.moveCursorDownStart() +
 *     Ansi.ERASE_LINE +
 *     "Bob!",
 * );
 * ```
 */
export function moveCursorDownStart(x = 1): string {
  return `\x1b[${x}E`;
}

/**
 * Moves cursor position `x` columns right or up to the right margin.
 *
 * @param x The number of columns to move right.
 * @returns The ANSI escape code for moving the cursor right.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.moveCursorRight(2) + "Hello World!");
 * ```
 */
export function moveCursorRight(x = 1): string {
  return `\x1b[${x}C`;
}

/**
 * Moves cursor position `x` tab stops right or up to the right margin.
 *
 * @param x The number of tab stops to move right.
 * @returns The ANSI escape code for moving the cursor right every tab
 * stop.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.moveCursorRightTab() + "Hello World!");
 * ```
 */
export function moveCursorRightTab(x = 1): string {
  return `\x1b[${x}I`;
}

/**
 * Moves cursor position `x` columns left or up to the left margin.
 *
 * @param x The number of columns to move left.
 * @returns The ANSI escape code for moving the cursor left.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(
 *   Ansi.moveCursorRight(4) +
 *     Ansi.moveCursorLeft(2) +
 *     "Hello World!",
 * );
 * ```
 */
export function moveCursorLeft(x = 1): string {
  return `\x1b[${x}D`;
}

/**
 * Moves cursor position `x` tab stops left or up to the left margin.
 *
 * @param x The number of tab stops to move left.
 * @returns The ANSI escape code for moving the cursor left every tab
 * stop.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(
 *   Ansi.moveCursorRightTab(2) +
 *     Ansi.moveCursorLeftTab() +
 *     "Hello World!",
 * );
 * ```
 */
export function moveCursorLeftTab(x = 1): string {
  return `\x1b[${x}Z`;
}

/**
 * Sets cursor position to column `x` or up to the sides of the margins.
 * Columns begin at `1` not `0`.
 *
 * @param x The column to move to.
 * @returns The ANSI escape code for setting the cursor column.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUp() +
 *     Ansi.setCursorColumn(7) +
 *     "and Goodbye!",
 * );
 * ```
 */
export function setCursorColumn(x = 1): string {
  return `\x1b[${x}G`;
}

/**
 * Sets cursor position to line `x` or down to the bottom of the margin.
 * Lines begin at `1` not `0`.
 *
 * @param x The line to move to.
 * @returns The ANSI escape code for setting the cursor line.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.setCursorLine() + Ansi.ERASE_LINE + "Hello World!");
 * ```
 */
export function setCursorLine(x = 1): string {
  return `\x1b[${x}d`;
}

/**
 * Sets cursor position to `x` line and `y` column or up to the margin. Lines
 * and columns begin at `1` not `0`.
 *
 * @param x The line to move to.
 * @param y The column to move to.
 * @returns The ANSI escape code for setting the cursor position.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(
 *   Ansi.setCursorPosition(5, 2) +
 *   Ansi.ERASE_LINE +
 *   "Hello World!",
 * );
 * ```
 */
export function setCursorPosition(x = 1, y = 1): string {
  return `\x1b[${x};${y}H`;
}

/**
 * Erases line content to the right of cursor position.
 *
 * @returns The ANSI escape code for erasing the line content to the
 * right of the cursor.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUp() +
 *     Ansi.setCursorColumn(7) +
 *     Ansi.ERASE_LINE_AFTER_CURSOR,
 * );
 * ```
 */
export const ERASE_LINE_AFTER_CURSOR = "\x1b[0K";

/**
 * Erases line content to the left of cursor position.
 *
 * @returns The ANSI escape code for erasing the line content to the
 * left of the cursor.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUp() +
 *     Ansi.setCursorColumn(7) +
 *     Ansi.ERASE_LINE_BEFORE_CURSOR,
 * );
 * ```
 */
export const ERASE_LINE_BEFORE_CURSOR = "\x1b[1K";

/**
 * Erases entire line content.
 *
 * @returns The ANSI escape code for erasing the entire line content.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(Ansi.moveCursorUp() + Ansi.ERASE_LINE);
 * ```
 */
export const ERASE_LINE = "\x1b[2K";

/**
 * Erases content of lines below cursor position and content to the right on
 * the same line as cursor.
 *
 * @returns The ANSI escape code for erasing the content after the
 * cursor.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUp() +
 *     Ansi.setCursorColumn(7) +
 *     Ansi.ERASE_DISPLAY_AFTER_CURSOR,
 * );
 * ```
 */
export const ERASE_DISPLAY_AFTER_CURSOR = "\x1b[0J";

/**
 * Erases content of lines above cursor position and content to the left on
 * the same line as cursor.
 *
 * @returns The ANSI escape code for erasing the content before the
 * cursor.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(
 *   Ansi.moveCursorUp() +
 *     Ansi.setCursorColumn(7) +
 *     Ansi.ERASE_DISPLAY_BEFORE_CURSOR,
 * );
 * ```
 */
export const ERASE_DISPLAY_BEFORE_CURSOR = "\x1b[1J";

/**
 * Erases all content.
 *
 * @returns The ANSI escape code for erasing the entire display.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(Ansi.ERASE_DISPLAY);
 * ```
 */
export const ERASE_DISPLAY = "\x1b[2J";

/**
 * Shifts content within the scrollable region up `x` lines, inserting blank
 * lines at the bottom of the scrollable region.
 *
 * @param x The number of lines content should be shifted up.
 * @returns The ANSI escape code for shifting content up.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.shiftUpAndInsert());
 * ```
 */
export function shiftUpAndInsert(x = 1): string {
  return `\x1b[${x}S`;
}

/**
 * Shifts content within the scrollable region down `x` lines, inserting
 * blank lines at the top of the scrollable region.
 *
 * @param x The number of lines content should be shifted down.
 * @returns The ANSI escape code for shifting content down.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.shiftDownAndInsert(3));
 * ```
 */
export function shiftDownAndInsert(x = 1): string {
  return `\x1b[${x}T`;
}

/**
 * Repeats last graphic character printed `x` times at cursor position.
 *
 * @param x The number of times the last character printed should be repeated.
 * @returns The ANSI escape code for repeating the last printed
 * character.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!" + Ansi.repeatLastCharacter(4));
 * ```
 */
export function repeatLastCharacter(x = 1): string {
  return `\x1b[${x}b`;
}

/**
 * Causes existing characters to the right of the cursor position to shift
 * right as new characters are written. Opposite of
 * {@linkcode REPLACE_MODE}.
 *
 * @returns The ANSI escape code for entering insert mode.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(
 *   Ansi.INSERT_MODE +
 *     Ansi.moveCursorUp() +
 *     Ansi.setCursorColumn(7) +
 *     "and Goodbye " +
 *     Ansi.REPLACE_MODE,
 * );
 * ```
 */
export const INSERT_MODE = "\x1b[4h";

/**
 * Causes existing characters to be overwritten at the cursor position by new
 * characters. See also {@linkcode INSERT_MODE}.
 *
 * @returns The ANSI escape code for entering replace mode.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log("Hello World!");
 * await delay(1000);
 * console.log(
 *   Ansi.INSERT_MODE +
 *     Ansi.moveCursorUp() +
 *     Ansi.setCursorColumn(7) +
 *     "and Goodbye " +
 *     Ansi.REPLACE_MODE,
 * );
 * ```
 */
export const REPLACE_MODE = "\x1b[4l";

/**
 * Causes top and bottom margins to shrink to scrollable region (See
 * {@linkcode setScrollableRegion}) preventing the cursor from moving
 * to the lines outside it.
 *
 * @returns The ANSI escape code for enabling origin mode.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(
 *   Ansi.ERASE_DISPLAY +
 *     Ansi.setCursorPosition() +
 *     "Hello World" +
 *     Ansi.setScrollableRegion(2) +
 *     Ansi.ENABLE_ORIGIN_MODE,
 * );
 * await delay(1000);
 * console.log(Ansi.setCursorPosition() + "Bye World!");
 * ```
 */
export const ENABLE_ORIGIN_MODE = "\x1b[?6h";

/**
 * Causes the top and bottom margins to enlarge to the user's display. See
 * {@linkcode ENABLE_ORIGIN_MODE}.
 *
 * @returns The ANSI escape code for disabling origin mode.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(
 *   Ansi.ERASE_DISPLAY +
 *     Ansi.setCursorPosition() +
 *     "Hello World" +
 *     Ansi.setScrollableRegion(2) +
 *     Ansi.ENABLE_ORIGIN_MODE,
 * );
 * await delay(1000);
 * console.log(Ansi.setCursorPosition() + "Bye World!");
 * await delay(1000);
 * console.log(
 *   Ansi.DISABLE_ORIGIN_MODE +
 *     Ansi.setCursorPosition() +
 *     Ansi.ERASE_LINE +
 *     "Hi World!",
 * );
 * ```
 */
export const DISABLE_ORIGIN_MODE = "\x1b[?6l";

/**
 * Causes cursor to automatically move to the next line when it hits the
 * end of the current line to continue writing. See also
 * {@linkcode DISABLE_AUTO_WRAP}.
 *
 * @returns The ANSI escape code to enable auto-wrap.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.ENABLE_AUTO_WRAP + "A" + "h".repeat(500));
 * ```
 */
export const ENABLE_AUTO_WRAP = "\x1b[?7h";

/**
 * Causes cursor to remain on the same line when it hits the end of the
 * current line. See also {@linkcode ENABLE_AUTO_WRAP}.
 *
 * @returns The ANSI escape code to disable auto-wrap.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.DISABLE_AUTO_WRAP + "A" + "h".repeat(500));
 * ```
 */
export const DISABLE_AUTO_WRAP = "\x1b[?7l";

/**
 * Sets the cursor animation style.
 *
 * @param x The cursor style to set.
 * @returns The ANSI escape code to set the cursor style.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.setCursorStyle(Ansi.CursorStyle.BlinkingUnderline));
 * ```
 */
export function setCursorStyle(x: CursorStyle): string {
  return `\x1b[${x} q`;
}

/**
 * Causes cursor position to be visible to the user. See also
 * {@linkcode HIDE_CURSOR}.
 *
 * @returns The ANSI escape code to show the cursor.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.HIDE_CURSOR);
 * await delay(5000);
 * console.log(Ansi.SHOW_CURSOR);
 * ```
 */
export const SHOW_CURSOR = "\x1b[?25h";

/**
 * Causes cursor position to be hidden from the user. See also
 * {@linkcode SHOW_CURSOR}.
 *
 * @returns The ANSI escape code to hide the cursor.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.HIDE_CURSOR);
 * await delay(5000);
 * console.log(Ansi.SHOW_CURSOR);
 * ```
 */
export const HIDE_CURSOR = "\x1b[?25l";

/**
 * Sets the scrollable region of the display. Allowing either or both the top
 * and bottom lines to not have their content moved when the scrolling region
 * is updated. `x` is the top line of the scrollable region. `y` is the
 * bottom line of the scrollable region.
 *
 * @param x The top line of the scrollable region.
 * @param y The bottom line of the scrollable region.
 * @returns The ANSI escape code to set the scrollable region.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(
 *   Ansi.ERASE_DISPLAY +
 *     Ansi.setScrollableRegion(3, 10),
 * );
 * setInterval(() => console.log(Math.random()), 1000);
 * ```
 */
export function setScrollableRegion(x = 1, y?: number): string {
  return `\x1b[${x}${y == undefined ? "" : `;${y}`}r`;
}

/**
 * CursorStyle is a export const enum used to set the value in
 * {@linkcode setCursorStyle}.
 *
 * @example Usage
 * ```ts ignore
 * import * as Ansi from "@std/cli/unstable-ansi";
 *
 * console.log(Ansi.setCursorStyle(Ansi.CursorStyle.BlinkingUnderline));
 * ```
 */
export const enum CursorStyle {
  Default = 0,
  BlinkingBlock = 1,
  SteadyBlock = 2,
  BlinkingUnderline = 3,
  SteadyUnderline = 4,
  BlinkingBar = 5,
  SteadyBar = 6,
}
