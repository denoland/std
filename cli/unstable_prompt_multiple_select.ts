// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/** Options for {@linkcode promptMultipleSelect}. */
export interface PromptMultipleSelectOptions {
  /** Clear the lines after the user's input. */
  clear?: boolean;
}

const ETX = "\x03";
const ARROW_UP = "\u001B[A";
const ARROW_DOWN = "\u001B[B";
const CR = "\r";
const INDICATOR = "❯";
const PADDING = " ".repeat(INDICATOR.length);

const CHECKED = "◉";
const UNCHECKED = "◯";

const input = Deno.stdin;
const output = Deno.stdout;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const CLEAR_ALL = encoder.encode("\x1b[J"); // Clear all lines after cursor
const HIDE_CURSOR = encoder.encode("\x1b[?25l");
const SHOW_CURSOR = encoder.encode("\x1b[?25h");

/**
 * Shows the given message and waits for the user's input. Returns the user's selected value as string.
 *
 * @param message The prompt message to show to the user.
 * @param values The values for the prompt.
 * @param options The options for the prompt.
 * @returns The selected values as an array of strings or `null` if stdin is not a TTY.
 *
 * @example Usage
 * ```ts ignore
 * import { promptMultipleSelect } from "@std/cli/unstable-prompt-multiple-select";
 *
 * const browsers = promptMultipleSelect("Please select browsers:", ["safari", "chrome", "firefox"], { clear: true });
 * ```
 */
export function promptMultipleSelect(
  message: string,
  values: string[],
  options: PromptMultipleSelectOptions = {},
): string[] | null {
  if (!input.isTerminal()) return null;

  const { clear } = options;

  const length = values.length;
  let selectedIndex = 0;
  const selectedIndexes = new Set<number>();

  input.setRaw(true);
  output.writeSync(HIDE_CURSOR);

  const buffer = new Uint8Array(4);

  loop:
  while (true) {
    output.writeSync(encoder.encode(`${message}\r\n`));
    for (const [index, value] of values.entries()) {
      const selected = index === selectedIndex;
      const start = selected ? INDICATOR : PADDING;
      const checked = selectedIndexes.has(index);
      const state = checked ? CHECKED : UNCHECKED;
      output.writeSync(encoder.encode(`${start} ${state} ${value}\r\n`));
    }
    const n = input.readSync(buffer);
    if (n === null || n === 0) break;
    const string = decoder.decode(buffer.slice(0, n));

    switch (string) {
      case ETX:
        output.writeSync(SHOW_CURSOR);
        return Deno.exit(0);
      case ARROW_UP:
        selectedIndex = (selectedIndex - 1 + length) % length;
        break;
      case ARROW_DOWN:
        selectedIndex = (selectedIndex + 1) % length;
        break;
      case CR:
        break loop;
      case " ":
        if (selectedIndexes.has(selectedIndex)) {
          selectedIndexes.delete(selectedIndex);
        } else {
          selectedIndexes.add(selectedIndex);
        }
        break;
    }
    output.writeSync(encoder.encode(`\x1b[${length + 1}A`));
  }

  if (clear) {
    output.writeSync(encoder.encode(`\x1b[${length + 1}A`));
    output.writeSync(CLEAR_ALL);
  }

  output.writeSync(SHOW_CURSOR);
  input.setRaw(false);

  return [...selectedIndexes].map((it) => values[it] as string);
}
