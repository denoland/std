// Copyright 2018-2026 the Deno authors. MIT license.

import * as Ansi from "./unstable_ansi.ts";

let nextID = 0;
const linesAtTop: number[] = [];
const linesAtBottom: number[] = [];

const getRows = "Deno" in globalThis
  // deno-lint-ignore no-explicit-any
  ? (): number => (globalThis as any).Deno.consoleSize().rows
  // deno-lint-ignore no-explicit-any
  : (): number => (globalThis as any).process.stderr.rows;
const write = "Deno" in globalThis
  ? (() => {
    const encoder = new TextEncoder();
    return (x: string) =>
      // deno-lint-ignore no-explicit-any
      (globalThis as any).Deno.stderr.write(encoder.encode(x));
  })()
  // deno-lint-ignore no-explicit-any
  : (x: string) => (globalThis as any).process.stderr.write(x);

/**
 * StaticLine is a class that assigns a line in the terminal for you to write
 * to and that won't be overwritten by `console.log`.
 *
 * @example Usage
 * ```ts ignore
 * import { delay } from "@std/async/delay";
 * import { StaticLine } from "@std/cli/unstable-static-line";
 *
 * const id = setInterval(() => console.log(Math.random()), 1000);
 *
 * const line = new StaticLine();
 * await line.write("Hello World!");
 * await delay(1500);
 * await line.write("How are you?");
 * await delay(1500);
 * await line.write("Doing good?");
 * await delay(1500);
 * await line.releaseLine();
 * ```
 */
export class StaticLine {
  #id = ++nextID;
  #atTop: boolean;
  #lines: number[];
  #released = false;
  /**
   * Constructs a new instance.
   *
   * @param on What side of the terminal the line should be on.
   */
  constructor(on: "top" | "bottom" = "bottom") {
    this.#atTop = on === "top";
    this.#lines = this.#atTop ? linesAtTop : linesAtBottom;
    this.#lines.push(this.#id);
    const top = linesAtTop.length + 1;
    const bottom = getRows() - linesAtBottom.length;
    write(
      (this.#atTop ? "" : Ansi.shiftUpAndInsert()) +
        Ansi.setScrollableRegion(top, bottom) +
        Ansi.setCursorPosition(bottom),
    );
  }

  /**
   * Overwrites the contents of the line.
   *
   * @param line The new content to write.
   * @returns A promise that resolves when the line is written.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { StaticLine } from "@std/cli/unstable-static-line";
   *
   * const id = setInterval(() => console.log(Math.random()), 1000);
   *
   * const line = new StaticLine();
   * await line.write("Hello World!");
   * await delay(1500);
   * await line.write("How are you?");
   * await delay(1500);
   * await line.write("Doing good?");
   * await delay(1500);
   * await line.releaseLine();
   * ```
   */
  async write(line: string): Promise<void> {
    if (this.#released) throw new ReferenceError("Line has been released");
    await write(
      Ansi.SAVE_CURSOR +
        Ansi.DISABLE_ORIGIN_MODE +
        Ansi.DISABLE_AUTO_WRAP +
        Ansi.setCursorPosition(
          this.#atTop
            ? linesAtTop.indexOf(this.#id) + 1
            : getRows() - linesAtBottom.indexOf(this.#id),
        ) +
        Ansi.ERASE_LINE +
        line +
        Ansi.RESTORE_CURSOR,
    );
  }

  /**
   * Releases the line so other content can use it.
   *
   * @returns A promise that resolves when the line is released.
   *
   * @example Usage
   * ```ts ignore
   * import { delay } from "@std/async/delay";
   * import { StaticLine } from "@std/cli/unstable-static-line";
   *
   * const id = setInterval(() => console.log(Math.random()), 1000);
   *
   * const line = new StaticLine();
   * await line.write("Hello World!");
   * await delay(1500);
   * await line.write("How are you?");
   * await delay(1500);
   * await line.write("Doing good?");
   * await delay(1500);
   * await line.releaseLine();
   * ```
   */
  async releaseLine(): Promise<void> {
    if (this.#released) return;
    this.#released = true;
    const index = this.#lines.indexOf(this.#id);
    this.#lines.splice(index, 1);
    const rows = getRows();
    const top = linesAtTop.length + 1;
    const bottom = rows - linesAtBottom.length;
    await write(
      Ansi.SAVE_CURSOR +
        (this.#atTop
          ? (top - index
            ? Ansi.setScrollableRegion(index + 1, top + 1) +
              Ansi.shiftUpAndInsert()
            : Ansi.setCursorPosition(index + 1) +
              Ansi.ERASE_LINE)
          : (rows - index - bottom
            ? Ansi.setScrollableRegion(
              bottom,
              rows - index,
            ) +
              Ansi.shiftDownAndInsert()
            : Ansi.setCursorPosition(rows) +
              Ansi.ERASE_LINE)) +
        Ansi.setScrollableRegion(top, bottom) +
        Ansi.RESTORE_CURSOR,
    );
  }
}
