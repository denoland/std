// Copyright 2018-2025 the Deno authors. MIT license.

// https://invisible-island.net/xterm/ctlseqs/ctlseqs.html
// TODO: CSI Ps n

export class Ansi {
  /**
   * Causes content on the current line to enlarge, showing only the top half
   * of characters with each character taking up two columns. Can be used in
   * combination with {@linkcode Ansi.doubleHeightBottom} on the next line to
   * make text appear twice as big.
   */
  static get doubleHeightTop(): string {
    return "\x1b#3";
  }

  /**
   * Causes content on the current line to enlarge, showing only the bottom
   * half of the characters with each character taking up two columns. Can be
   * used in combination with {@linkcode Ansi.doubleHeightTop} on the previous
   * line to make text appear twice as big.
   */
  static get doubleHeightBottom(): string {
    return "\x1b#4";
  }

  /**
   * Causes content on the current line to shrink down to a single column,
   * essentally reverting the effects of {@linkcode Ansi.doubleHeightTop}, {@linkcode Ansi.doubleHeightBottom}, or {@linkcode Ansi.doubleWidth}.
   */
  static get singleWidth(): string {
    return "\x1b#5";
  }

  /**
   * Causes content on the current line to stretch out, with each character
   * taking up two columns. Can be reverted with {@linkcode Ansi.singleWidth}
   */
  static get doubleWidth(): string {
    return "\x1b#6";
  }

  /**
   * Saves current cursor position that can later be restored with
   * {@linkcode Ansi.restoreCursorPosition}.
   */
  static get saveCursorPosition(): string {
    return "\x1b7";
  }

  /**
   * Restores cursor position that was earlier saved with
   * {@linkcode Ansi.saveCursorPosition}.
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
   */
  static get hardReset(): string {
    return "\x1bc";
  }

  /**
   * This command resets many settings to their inital state without fully
   * reinitalising the terminal like {@linkcode Ansi.hardReset}. It preserves
   * things like cursor position and display content, but clears modes,
   * character sets, etc. Should probably be called when exiting the program.
   */
  static get softReset(): string {
    return "\x1b[!p";
  }

  /**
   * Inserts `x` spaces at the cursor position. Shifting existing line content
   * to the right. Cursor position does not change. Characters that exit the
   * display are discarded.
   */
  static insertSpace(x = 1): string {
    return `\x1b[${x}@`;
  }

  /**
   * Deletes `x` characters at cursor position and to the right. Shifting line
   * content left.
   */
  static deleteCharacters(x = 1): string {
    return `\x1b[${x}P`;
  }

  /**
   * Erases `x` characters at cursor position and to the right.
   */
  static eraseCharacters(x = 1): string {
    return `\x1b[${x}X`;
  }

  /**
   * Inserts `x` lines at cursor position. Shifting current line and below
   * down. Cursor position does not change. Characters that exit the display
   * are discarded.
   */
  static insertLines(x = 1): string {
    return `\x1b[${x}L`;
  }

  /**
   * Deletes `x` lines at cursor position. Shifting below lines up.
   */
  static deleteLines(x = 1): string {
    return `\x1b[${x}M`;
  }

  /**
   * Moves cursor position up `x` lines or up to the top margin.
   */
  static moveCursorUp(x = 1): string {
    return `\x1b[${x}A`;
  }

  /**
   * Moves cursor position `x` lines up or up to the top of the margin, and to
   * the beginning of that line.
   */
  static moveCursorUpStart(x = 1): string {
    return `\x1b[${x}F`;
  }

  /**
   * Moves cursor position down `x` lines or up to the bottom margin.
   */
  static moveCursorDown(x = 1): string {
    return `\x1b[${x}B`;
  }

  /**
   * Moves cursor position `x` lines down or up to the bottom margin, and to
   * the beginning of that line.
   */
  static moveCursorDownStart(x = 1): string {
    return `\x1b[${x}E`;
  }

  /**
   * Moves cursor position `x` columns right or up to the right margin.
   */
  static moveCursorRight(x = 1): string {
    return `\x1b[${x}C`;
  }

  /**
   * Moves cursor position `x` tab stops right or up to the right margin.
   */
  static moveCursorRightTab(x = 1): string {
    return `\x1b[${x}I`;
  }

  /**
   * Moves cursor position `x` columns left or up to the left margin.
   */
  static moveCursorLeft(x = 1): string {
    return `\x1b[${x}D`;
  }

  /**
   * Moves cursor position `x` tab stops left or up to the left margin.
   */
  static moveCursorLeftTab(x = 1): string {
    return `\x1b[${x}Z`;
  }

  /**
   * Sets cursor position to column `x` or up to the sides of the margins.
   * Columns begin at `1` not `0`.
   */
  static setCursorColumn(x = 1): string {
    return `\x1b[${x}G`;
  }

  /**
   * Sets cursor position to line `x` or down to the bottom of the margin.
   * Lines begin at `1` not `0`.
   */
  static setCursorLine(x = 1): string {
    return `\x1b[${x}d`;
  }

  /**
   * Sets cursor position to `x` line and `y` column or up to the margin. Lines
   * and columns begin at `1` not `0`.
   */
  static setCursorPosition(x = 1, y = 1): string {
    return `\x1b[${x};${y}H`;
  }

  /**
   * Erases line content to the right of cursor position.
   */
  static get eraseLineAfterCursor(): string {
    return "\x1b[0K";
  }

  /**
   * Erases line content to the left of cursor position.
   */
  static get eraseLineBeforeCursor(): string {
    return "\x1b[1K";
  }

  /**
   * Erases entire line content.
   */
  static get eraseLine(): string {
    return "\x1b[2K";
  }

  /**
   * Erases content of lines below cursor position and content to the right on
   * the same line as cursor.
   */
  static get eraseDisplayAfterCursor(): string {
    return "\x1b[0J";
  }

  /**
   * Erases content of lines above cursor position and content to the left on
   * the same line as cursor.
   */
  static get eraseDisplayBeforeCursor(): string {
    return "\x1b[1J";
  }

  /**
   * Erases all content.
   */
  static get eraseDisplay(): string {
    return "\x1b[2J";
  }

  /**
   * Shifts content within the scrollable region up `x` lines, inserting blank
   * lines at the bottom of the scrollable region.
   */
  static shiftUpAndInsert(x = 1): string {
    return `\x1b[${x}S`;
  }

  /**
   * Shifts content within the scrollable region down `x` lines, inserting
   * blank lines at the top of the scrollable region.
   */
  static shiftDownAndInsert(x = 1): string {
    return `\x1b[${x}T`;
  }

  /**
   * Repeats last graphic character printed `x` times at cursor position.
   */
  static repeatLastCharacter(x = 1): string {
    return `\x1b[${x}b`;
  }

  /**
   * Causes existing characters to the right of the cursor position to shift
   * right as new characters are written. Opposite of
   * {@linkcode Ansi.replaceMode}.
   */
  static get insertMode(): string {
    return "\x1b[4h";
  }

  /**
   * Causes existing characters to be overwritten at the cursor position by new
   * characters. See also {@linkcode Ansi.insertMode}.
   */
  static get replaceMode(): string {
    return "\x1b[4l";
  }

  /**
   * Causes top and bottom margins to shrink to scrollable region (See
   * {@linkcode Ansi.setScrollableRegion}) preventing the cursor from moving
   * to the lines outside it.
   */
  static get enableOriginMode(): string {
    return "\x1b[?6h";
  }

  /**
   * Causes the top and bottom margins to enlarge to the user's display. See
   * {@linkcode Ansi.enableOriginMode}.
   */
  static get disableOriginMode(): string {
    return "\x1b[?6l";
  }

  /**
   * Causes cursor to automatically move to the next line when it hits the
   * end of the current line to continue writing. See also
   * {@linkcode Ansi.disableAutoWrap}.
   */
  static get enableAutoWrap(): string {
    return "\x1b[?7h";
  }

  /**
   * Causes cursor to remain on the same line when it hits the end of the
   * current line. See also {@linkcode Ansi.enableAutoWrap}.
   */
  static get disableAutoWrap(): string {
    return "\x1b[?7l";
  }

  /**
   * Sets the cursor animation style.
   */
  static setCursorStyle(x: CursorStyle): string {
    return `\x1b[${x} q`;
  }

  /**
   * Causes cursor position to be visible to the user. See also
   * {@linkcode Ansi.hideCursor}.
   */
  static get showCursor(): string {
    return "\x1b[?25h";
  }

  /**
   * Causes cursor position to be hidden from the user. See also
   * {@linkcode Ansi.showCursor}.
   */
  static get hideCursor(): string {
    return "\x1b[?25l";
  }

  /**
   * Sets the scrollable region of the display. Allowing either or both the top
   * and bottom lines to not have their content moved when the scrolling region
   * is updated. `x` is the top line of the scrollable region. `y` is the
   * bottom line of the scrollable region.
   */
  static setScrollableRegion(x = 1, y?: number): string {
    y ??= Deno.consoleSize().rows;
    return `\x1b[${x};${y}r`;
  }
}

export const enum CursorStyle {
  Default = 0,
  BlinkingBlock = 1,
  SteadyBlock = 2,
  BlinkingUnderline = 3,
  SteadyUnderline = 4,
  BlinkingBar = 5,
  SteadyBar = 6,
}
