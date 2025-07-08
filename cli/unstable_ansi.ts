// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * Ansi is a class with static methods and properties that returns various Ansi
 * Escape Sequences. This class is not an exhaustive list of what is possible
 * with Ansi Escape Sequences, nor does it guarentee that every code will work
 * in every terminal. The only way to guarentee that only one code will work in
 * a particular terminal, is to check for yourself. Calling these methods and
 * properties does not automatically change the terminal settings. Only once
 * they are passed to stdout or stderr will they take effect.
 *
 * These codes were based off the
 * [xterm reference](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html).
 *
 * @example Basic Usage
 * ```ts ignore
 * import { Ansi } from "@std/cli/unstable_ansi";
 *
 * console.log(Ansi.doubleHeightTop + "Hello World!");
 * console.log(Ansi.doubleHeightBottom + "Hello World!");
 * ```
 */
export class Ansi {
  /**
   * Causes content on the current line to enlarge, showing only the top half
   * of characters with each character taking up two columns. Can be used in
   * combination with {@linkcode Ansi.doubleHeightBottom} on the next line to
   * make text appear twice as big.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.doubleHeightTop + "Hello World!");
   * console.log(Ansi.doubleHeightBottom + "Hello World!");
   * ```
   */
  static get doubleHeightTop(): string {
    return "\x1b#3";
  }

  /**
   * Causes content on the current line to enlarge, showing only the bottom
   * half of the characters with each character taking up two columns. Can be
   * used in combination with {@linkcode Ansi.doubleHeightTop} on the previous
   * line to make text appear twice as big.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.doubleHeightTop + "Hello World!");
   * console.log(Ansi.doubleHeightBottom + "Hello World!");
   * ```
   */
  static get doubleHeightBottom(): string {
    return "\x1b#4";
  }

  /**
   * Causes content on the current line to shrink down to a single column,
   * essentally reverting the effects of {@linkcode Ansi.doubleHeightTop},
   * {@linkcode Ansi.doubleHeightBottom}, or {@linkcode Ansi.doubleWidth}.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.doubleHeightTop + "Hello World!");
   * console.log(Ansi.doubleHeightBottom + "Hello World!");
   * await delay(1000);
   * console.log(
   *   Ansi.moveCursorUpStart(2) +
   *     Ansi.deleteLines(1) +
   *     Ansi.singleWidth,
   * );
   * ```
   */
  static get singleWidth(): string {
    return "\x1b#5";
  }

  /**
   * Causes content on the current line to stretch out, with each character
   * taking up two columns. Can be reverted with {@linkcode Ansi.singleWidth}.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.doubleWidth + "Hello World!");
   * ```
   */
  static get doubleWidth(): string {
    return "\x1b#6";
  }

  /**
   * Saves current cursor position that can later be restored with
   * {@linkcode Ansi.restoreCursorPosition}.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(
   *   Ansi.saveCursorPosition +
   *     Ansi.setCursorPosition(Deno.consoleSize().rows, 1) +
   *     Ansi.eraseLine +
   *     "Hello World!" +
   *     Ansi.restoreCursorPosition,
   * );
   * ```
   */
  static get saveCursorPosition(): string {
    return "\x1b7";
  }

  /**
   * Restores cursor position that was earlier saved with
   * {@linkcode Ansi.saveCursorPosition}.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(
   *   Ansi.saveCursorPosition +
   *     Ansi.setCursorPosition(Deno.consoleSize().rows) +
   *     Ansi.eraseLine +
   *     "Hello World!" +
   *     Ansi.restoreCursorPosition,
   * );
   * ```
   */
  static get restoreCursorPosition(): string {
    return "\x1b8";
  }

  /**
   * This is a full reset of the terminal, reverting it back to its original
   * default settings, clearing the screen, resetting modes, colors, character
   * sets and more. Essentally making the terminal behave as if it were just
   * started by the user. This command is very disruptive to the user. Also see
   * {@linkcode Ansi.softReset}.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.hideCursor);
   * await delay(5000);
   * console.log(Ansi.hardReset);
   * ```
   */
  static get hardReset(): string {
    return "\x1bc";
  }

  /**
   * This command resets many settings to their inital state without fully
   * reinitalising the terminal like {@linkcode Ansi.hardReset}. It preserves
   * things like cursor position and display content, but clears modes,
   * character sets, etc. Should probably be called when exiting the program.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.hideCursor);
   * await delay(5000);
   * console.log(Ansi.softReset);
   * ```
   */
  static get softReset(): string {
    return "\x1b[!p";
  }

  /**
   * Inserts `x` spaces at the cursor position. Shifting existing line content
   * to the right. Cursor position does not change. Characters that exit the
   * display are discarded.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
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
  static insertSpace(x = 1): string {
    return `\x1b[${x}@`;
  }

  /**
   * Deletes `x` characters at cursor position and to the right. Shifting line
   * content left.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
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
  static deleteCharacters(x = 1): string {
    return `\x1b[${x}P`;
  }

  /**
   * Erases `x` characters at cursor position and to the right.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
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
  static eraseCharacters(x = 1): string {
    return `\x1b[${x}X`;
  }

  /**
   * Inserts `x` lines at cursor position. Shifting current line and below
   * down. Cursor position does not change. Characters that exit the display
   * are discarded.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
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
  static insertLines(x = 1): string {
    return `\x1b[${x}L`;
  }

  /**
   * Deletes `x` lines at cursor position. Shifting below lines up.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello\nWorld!");
   * await delay(1000);
   * console.log(Ansi.moveCursorUpStart() + Ansi.deleteLines());
   * await delay(1000);
   * console.log("and Goodbye!");
   * ```
   */
  static deleteLines(x = 1): string {
    return `\x1b[${x}M`;
  }

  /**
   * Moves cursor position up `x` lines or up to the top margin.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello\nWorld!");
   * await delay(1000);
   * console.log(Ansi.moveCursorUp(2) + "Goodbye");
   * ```
   */
  static moveCursorUp(x = 1): string {
    return `\x1b[${x}A`;
  }

  /**
   * Moves cursor position `x` lines up or up to the top of the margin, and to
   * the beginning of that line.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello\nWorld!");
   * await delay(1000);
   * console.log(Ansi.moveCursorUpStart(2) + "Goodbye");
   * ```
   */
  static moveCursorUpStart(x = 1): string {
    return `\x1b[${x}F`;
  }

  /**
   * Moves cursor position down `x` lines or up to the bottom margin.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello\nWorld!");
   * await delay(1000);
   * console.log(
   *   Ansi.moveCursorUpStart(2) +
   *     "Goodbye" +
   *     Ansi.moveCursorDown() +
   *     Ansi.setCursorColumn() +
   *     Ansi.eraseLine +
   *     "Bob!",
   * );
   * ```
   */
  static moveCursorDown(x = 1): string {
    return `\x1b[${x}B`;
  }

  /**
   * Moves cursor position `x` lines down or up to the bottom margin, and to
   * the beginning of that line.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello\nWorld!");
   * await delay(1000);
   * console.log(
   *   Ansi.moveCursorUpStart(2) +
   *     "Goodbye" +
   *     Ansi.moveCursorDownStart() +
   *     Ansi.eraseLine +
   *     "Bob!",
   * );
   * ```
   */
  static moveCursorDownStart(x = 1): string {
    return `\x1b[${x}E`;
  }

  /**
   * Moves cursor position `x` columns right or up to the right margin.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.moveCursorRight(2) + "Hello World!");
   * ```
   */
  static moveCursorRight(x = 1): string {
    return `\x1b[${x}C`;
  }

  /**
   * Moves cursor position `x` tab stops right or up to the right margin.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.moveCursorRightTab() + "Hello World!");
   * ```
   */
  static moveCursorRightTab(x = 1): string {
    return `\x1b[${x}I`;
  }

  /**
   * Moves cursor position `x` columns left or up to the left margin.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(
   *   Ansi.moveCursorRight(4) +
   *     Ansi.moveCursorLeft(2) +
   *     "Hello World!",
   * );
   * ```
   */
  static moveCursorLeft(x = 1): string {
    return `\x1b[${x}D`;
  }

  /**
   * Moves cursor position `x` tab stops left or up to the left margin.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(
   *   Ansi.moveCursorRightTab(2) +
   *     Ansi.moveCursorLeftTab() +
   *     "Hello World!",
   * );
   */
  static moveCursorLeftTab(x = 1): string {
    return `\x1b[${x}Z`;
  }

  /**
   * Sets cursor position to column `x` or up to the sides of the margins.
   * Columns begin at `1` not `0`.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
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
  static setCursorColumn(x = 1): string {
    return `\x1b[${x}G`;
  }

  /**
   * Sets cursor position to line `x` or down to the bottom of the margin.
   * Lines begin at `1` not `0`.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.setCursorLine() + Ansi.eraseLine + "Hello World!");
   * ```
   */
  static setCursorLine(x = 1): string {
    return `\x1b[${x}d`;
  }

  /**
   * Sets cursor position to `x` line and `y` column or up to the margin. Lines
   * and columns begin at `1` not `0`.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(
   *   Ansi.setCursorPosition(5, 2) +
   *   Ansi.eraseLine +
   *   "Hello World!",
   * );
   * ```
   */
  static setCursorPosition(x = 1, y = 1): string {
    return `\x1b[${x};${y}H`;
  }

  /**
   * Erases line content to the right of cursor position.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello World!");
   * await delay(1000);
   * console.log(
   *   Ansi.moveCursorUp() +
   *     Ansi.setCursorColumn(7) +
   *     Ansi.eraseLineAfterCursor,
   * );
   * ```
   */
  static get eraseLineAfterCursor(): string {
    return "\x1b[0K";
  }

  /**
   * Erases line content to the left of cursor position.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello World!");
   * await delay(1000);
   * console.log(
   *   Ansi.moveCursorUp() +
   *     Ansi.setCursorColumn(7) +
   *     Ansi.eraseLineBeforeCursor,
   * );
   * ```
   */
  static get eraseLineBeforeCursor(): string {
    return "\x1b[1K";
  }

  /**
   * Erases entire line content.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello World!");
   * await delay(1000);
   * console.log(Ansi.moveCursorUp() + Ansi.eraseLine);
   * ```
   */
  static get eraseLine(): string {
    return "\x1b[2K";
  }

  /**
   * Erases content of lines below cursor position and content to the right on
   * the same line as cursor.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello World!");
   * await delay(1000);
   * console.log(
   *   Ansi.moveCursorUp() +
   *     Ansi.setCursorColumn(7) +
   *     Ansi.eraseDisplayAfterCursor,
   * );
   * ```
   */
  static get eraseDisplayAfterCursor(): string {
    return "\x1b[0J";
  }

  /**
   * Erases content of lines above cursor position and content to the left on
   * the same line as cursor.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello World!");
   * await delay(1000);
   * console.log(
   *   Ansi.moveCursorUp() +
   *     Ansi.setCursorColumn(7) +
   *     Ansi.eraseDisplayBeforeCursor,
   * );
   * ```
   */
  static get eraseDisplayBeforeCursor(): string {
    return "\x1b[1J";
  }

  /**
   * Erases all content.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello World!");
   * await delay(1000);
   * console.log(Ansi.eraseDisplay);
   * ```
   */
  static get eraseDisplay(): string {
    return "\x1b[2J";
  }

  /**
   * Shifts content within the scrollable region up `x` lines, inserting blank
   * lines at the bottom of the scrollable region.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.shiftUpAndInsert());
   * ```
   */
  static shiftUpAndInsert(x = 1): string {
    return `\x1b[${x}S`;
  }

  /**
   * Shifts content within the scrollable region down `x` lines, inserting
   * blank lines at the top of the scrollable region.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.shiftDownAndInsert(3));
   * ```
   */
  static shiftDownAndInsert(x = 1): string {
    return `\x1b[${x}T`;
  }

  /**
   * Repeats last graphic character printed `x` times at cursor position.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello World!" + Ansi.repeatLastCharacter(4));
   * ```
   */
  static repeatLastCharacter(x = 1): string {
    return `\x1b[${x}b`;
  }

  /**
   * Causes existing characters to the right of the cursor position to shift
   * right as new characters are written. Opposite of
   * {@linkcode Ansi.replaceMode}.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello World!");
   * await delay(1000);
   * console.log(
   *   Ansi.insertMode +
   *     Ansi.moveCursorUp() +
   *     Ansi.setCursorColumn(7) +
   *     "and Goodbye " +
   *     Ansi.replaceMode,
   * );
   * ```
   */
  static get insertMode(): string {
    return "\x1b[4h";
  }

  /**
   * Causes existing characters to be overwritten at the cursor position by new
   * characters. See also {@linkcode Ansi.insertMode}.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log("Hello World!");
   * await delay(1000);
   * console.log(
   *   Ansi.insertMode +
   *     Ansi.moveCursorUp() +
   *     Ansi.setCursorColumn(7) +
   *     "and Goodbye " +
   *     Ansi.replaceMode,
   * );
   * ```
   */
  static get replaceMode(): string {
    return "\x1b[4l";
  }

  /**
   * Causes top and bottom margins to shrink to scrollable region (See
   * {@linkcode Ansi.setScrollableRegion}) preventing the cursor from moving
   * to the lines outside it.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(
   *   Ansi.eraseDisplay +
   *     Ansi.setCursorPosition() +
   *     "Hello World" +
   *     Ansi.setScrollableRegion(2) +
   *     Ansi.enableOriginMode,
   * );
   * await delay(1000);
   * console.log(Ansi.setCursorPosition() + "Bye World!");
   * ```
   */
  static get enableOriginMode(): string {
    return "\x1b[?6h";
  }

  /**
   * Causes the top and bottom margins to enlarge to the user's display. See
   * {@linkcode Ansi.enableOriginMode}.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(
   *   Ansi.eraseDisplay +
   *     Ansi.setCursorPosition() +
   *     "Hello World" +
   *     Ansi.setScrollableRegion(2) +
   *     Ansi.enableOriginMode,
   * );
   * await delay(1000);
   * console.log(Ansi.setCursorPosition() + "Bye World!");
   * await delay(1000);
   * console.log(
   *   Ansi.disableOriginMode +
   *     Ansi.setCursorPosition() +
   *     Ansi.eraseLine +
   *     "Hi World!",
   * );
   * ```
   */
  static get disableOriginMode(): string {
    return "\x1b[?6l";
  }

  /**
   * Causes cursor to automatically move to the next line when it hits the
   * end of the current line to continue writing. See also
   * {@linkcode Ansi.disableAutoWrap}.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.enableAutoWrap + "A" + "h".repeat(500));
   * ```
   */
  static get enableAutoWrap(): string {
    return "\x1b[?7h";
  }

  /**
   * Causes cursor to remain on the same line when it hits the end of the
   * current line. See also {@linkcode Ansi.enableAutoWrap}.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.disableAutoWrap + "A" + "h".repeat(500));
   * ```
   */
  static get disableAutoWrap(): string {
    return "\x1b[?7l";
  }

  /**
   * Sets the cursor animation style.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.setCursorStyle(CursorStyle.BlinkingUnderline));
   * ```
   */
  static setCursorStyle(x: CursorStyle): string {
    return `\x1b[${x} q`;
  }

  /**
   * Causes cursor position to be visible to the user. See also
   * {@linkcode Ansi.hideCursor}.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.hideCursor);
   * await delay(5000);
   * console.log(Ansi.showCursor);
   */
  static get showCursor(): string {
    return "\x1b[?25h";
  }

  /**
   * Causes cursor position to be hidden from the user. See also
   * {@linkcode Ansi.showCursor}.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(Ansi.hideCursor);
   * await delay(5000);
   * console.log(Ansi.showCursor);
   */
  static get hideCursor(): string {
    return "\x1b[?25l";
  }

  /**
   * Sets the scrollable region of the display. Allowing either or both the top
   * and bottom lines to not have their content moved when the scrolling region
   * is updated. `x` is the top line of the scrollable region. `y` is the
   * bottom line of the scrollable region.
   *
   * @example Usage
   * ```ts ignore
   * import { Ansi } from "@std/cli/unstable_ansi";
   *
   * console.log(
   *   Ansi.eraseDisplay +
   *     Ansi.setScrollableRegion(3, 10),
   * );
   * setInterval(() => console.log(Math.random()), 1000);
   * ```
   */
  static setScrollableRegion(x = 1, y?: number): string {
    return `\x1b[${x}${y == undefined ? "" : `;${y}`}r`;
  }
}

/**
 * CurorStyle is a const enum used to set the value in
 * {@linkcode Ansi.setCursorStyle}.
 *
 * @example Usage
 * ```ts ignore
 * import { Ansi } from "@std/cli/unstable_ansi";
 *
 * console.log(Ansi.setCursorStyle(CursorStyle.BlinkingUnderline));
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
