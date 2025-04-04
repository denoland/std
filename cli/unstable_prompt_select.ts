// Copyright 2018-2025 the Deno authors. MIT license.

/** Options for {@linkcode promptSelect}. */
export interface PromptSelectOptions {
  /** Clear the lines after the user's input. */
  clear?: boolean;

  /** The number of lines to be visible at once */
  visibleLines?: number;

  /** The string to indicate the selected item */
  indicator?: string;
}

const ETX = "\x03";
const ARROW_UP = "\u001B[A";
const ARROW_DOWN = "\u001B[B";
const CR = "\r";

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
 * const browser = promptSelect("What country are you from?", [
 *   "Brazil",
 *   "United States",
 *   "Japan",
 *   "China",
 *   "Canada",
 *   "Spain",
 * ], { clear: true, visibleLines: 3, indicator: "*" });
 * ```
 */
export function promptSelect(
  message: string,
  values: string[],
  options: PromptSelectOptions = {},
): string | null {
  if (!input.isTerminal()) return null;

  const {
    // Deno.consoleSize().rows - 3 because we need to output the message, the terminal line
    // and we dont actually use the last line
    visibleLines = Math.min(Deno.consoleSize().rows - 3, values.length),
    indicator = "❯",
  } = options;
  const PADDING = " ".repeat(indicator.length);

  const length = values.length;
  let selectedIndex = 0;
  let showIndex = 0;
  let offset = 0;

  input.setRaw(true);
  output.writeSync(HIDE_CURSOR);

  const buffer = new Uint8Array(4);

  loop:
  while (true) {
    output.writeSync(encoder.encode(`${message}\r\n`));
    const chunk = values.slice(offset, visibleLines + offset);
    for (const [index, value] of chunk.entries()) {
      const start = index === showIndex ? indicator : PADDING;
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
        if (selectedIndex > 0) {
          selectedIndex--;
          if (selectedIndex < offset) {
            offset--;
          }
        }
        showIndex = Math.max(showIndex - 1, 0);
        break;
      case ARROW_DOWN:
        if (selectedIndex < length - 1) {
          selectedIndex++;
          if (selectedIndex >= offset + visibleLines) {
            offset++;
          }
          showIndex = Math.min(showIndex + 1, visibleLines - 1);
        }
        break;
      case CR:
        break loop;
    }
    output.writeSync(encoder.encode(`\x1b[${visibleLines + 1}A`));
    output.writeSync(CLR_ALL);
  }

  if (options.clear) {
    output.writeSync(encoder.encode(`\x1b[${visibleLines + 1}A`));
    output.writeSync(CLR_ALL);
  }

  output.writeSync(SHOW_CURSOR);
  input.setRaw(false);

  return values[selectedIndex] ?? null;
}
