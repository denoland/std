// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/** Options for {@linkcode promptSelect}. */
export interface PromptSelectOptions {
  /** Clear the lines after the user's input. */
  clear?: boolean;
}

const ETX = "\x03";
const ARROW_UP = "\u001B[A";
const ARROW_DOWN = "\u001B[B";
const CR = "\r";
const INDICATOR = "❯";
const PADDING = " ".repeat(INDICATOR.length);

const input = Deno.stdin;
const output = Deno.stdout;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const CLR_ALL = encoder.encode("\x1b[J"); // Clear all lines after cursor
const HIDE_CURSOR = encoder.encode("\x1b[?25l");
const SHOW_CURSOR = encoder.encode("\x1b[?25h");

/**
 * Shows the given message and waits for the user's input. Returns the user's selected value as string.
 *
 * @param message The prompt message to show to the user.
 * @param values The values for the prompt.
 * @param options The options for the prompt.
 * @returns The string that was entered or `null` if stdin is not a TTY.
 *
 * @example Usage
 * ```ts ignore
 * import { promptSelect } from "@std/cli/prompt-select";
 *
 * const browser = promptSelect("Please select a browser:", ["safari", "chrome", "firefox"], { clear: true });
 * ```
 */
export function promptSelect(
  message: string,
  values: string[],
  { clear }: PromptSelectOptions = {},
): string | null {
  if (!input.isTerminal()) return null;

  const length = values.length;
  let selectedIndex = 0;

  input.setRaw(true);
  output.writeSync(HIDE_CURSOR);

  const buffer = new Uint8Array(4);

  loop:
  while (true) {
    output.writeSync(encoder.encode(`${message}\r\n`));
    for (const [index, value] of values.entries()) {
      const start = index === selectedIndex ? INDICATOR : PADDING;
      output.writeSync(encoder.encode(`${start} ${value}\r\n`));
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
    }
    output.writeSync(encoder.encode(`\x1b[${length + 1}A`));
  }

  if (clear) {
    output.writeSync(encoder.encode(`\x1b[${length + 1}A`));
    output.writeSync(CLR_ALL);
  }

  output.writeSync(SHOW_CURSOR);
  input.setRaw(false);

  return values[selectedIndex] ?? null;
}
