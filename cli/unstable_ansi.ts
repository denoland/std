import { delay } from "@std/async/delay";
export class Ansi {
  /**
   * Inserts `x` spaces at the cursor position. Shifting existing line content
   * to the right. Overflow is discarded.
   */
  static insertBlanks(x = 1): string {
    return `\x1b[${x}@`;
  }
  /**
   * Inserts `x` lines at cursor position. Shifting current line and below
   * down. Overflow is discarded.
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
   * Deletes `x` characters at cursor position and to the right. Shifting line
   * content left.
   */
  static deleteCharacters(x = 1): string {
    return `\x1b[${x}P`;
  }
  /**
   * Moves cursor position up `x` lines or up to the top margin.
   */
  static moveCursorUp(x = 1): string {
    return `\x1b[${x}A`;
  }
  /**
   * Moves cursor position down `x` lines or up to the bottom margin.
   */
  static moveCursorDown(x = 1): string {
    return `\x1b[${x}B`;
  }
  /**
   * Moves cursor position `x` columns right or up to the right margin.
   */
  static moveCursorRight(x = 1): string {
    return `\x1b[${x}C`;
  }
  /**
   * Moves cursor position `x` columns left or up to the left margin.
   */
  static moveCursorLeft(x = 1): string {
    return `\x1b[${x}D`;
  }
  /**
   * Moves cursor position `x` lines down or up to the bottom margin, and to
   * the beginning of the line.
   */
  static moveCursorDownStart(x = 1): string {
    return `\x1b[${x}E`;
  }
  /**
   * Moves cursor position `x` lines up or up to the top of the margin, and to the beginning of the line.
   */
  static moveCursorUpStart(x = 1): string {
    return `\x1b[${x}F`;
  }
  /**
   * Sets cursor column position to `x` or up to the sides of the margins.
   */
  static setCursorColumn(x = 1): string {
    return `\x1b[${x}G`;
  }
  /**
   * Sets cursor position to `x` line and `y` column or up to the margin.
   */
  static setCursorPosition(x = 1, y = 1): string {
    return `\x1b[${x};${y}H`;
  }
  /**
   * Moves cursor position `x` tab stops right or up to the right margin.
   */
  static moveCursorRightTab(x = 1): string {
    return `\x1b[${x}I`;
  }
  /**
   * Moves cursor position `x` tab stops left or up to the left margin.
   */
  static moveCursorLeftTab(x = 1): string {
    return `\x1b[${x}Z`;
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
   * the same line eas cursor.
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
   * Scrolls the scrollable region `x` lines up. Inserts blank lines at the
   * bottom of the scrollable region.
   */
  static scrollDownAndInsert(x = 1): string {
    return `\x1b[${x}S`;
  }
  /**
   * Scroll the scrollable region `x` lines down. Insert blank lines at the top of the scrollable region
   */
  static scrollUpAndInsert(x = 1): string {
    return `\x1b[${x}T`;
  }
  /**
   * Erases `x` characters at cursor position and to the right.
   */
  static eraseCharacters(x = 1): string {
    return `\x1b[${x}X`;
  }
}

const encoder = new TextEncoder();
async function write(text: string): Promise<void> {
  await Deno.stderr.write(encoder.encode(text));
}

const steps: string[] = [
  "Hello World\nHello World\nHello World",
  "\x1b[1 t\x07",
];

for (const step of steps) {
  await write(step);
  await delay(1000);
}
await write("\n");
