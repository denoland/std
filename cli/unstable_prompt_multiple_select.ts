// Copyright 2018-2025 the Deno authors. MIT license.

/** Options for {@linkcode promptMultipleSelect}. */
export interface PromptMultipleSelectOptions {
  /** Clear the lines after the user's input. */
  clear?: boolean;
}

const ETX = "\x03";
const ARROW_UP = "\u001B[A";
const ARROW_DOWN = "\u001B[B";
const CR = "\r";
const DELETE = "\u007F";
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

  const indexedValues = values.map((value, index) => ({ value, index }));
  let length = values.length;
  let selectedIndex = 0;
  const selectedIndexes = new Set<number>();

  input.setRaw(true);
  output.writeSync(HIDE_CURSOR);

  const buffer = new Uint8Array(4);

  let searchBuffer = "";

  loop:
  while (true) {
    output.writeSync(
      encoder.encode(
        `${message + (searchBuffer ? ` (filter: ${searchBuffer})` : "")}\r\n`,
      ),
    );
    const filteredChunks = indexedValues.filter((item) => {
      if (searchBuffer === "") {
        return true;
      } else {
        return item.value.toLowerCase().includes(searchBuffer.toLowerCase());
      }
    });
    length = filteredChunks.length;
    for (const { value, index } of filteredChunks.values()) {
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
        if (selectedIndex === 0) {
          selectedIndex = filteredChunks.at(-1)!.index;
        } else {
          selectedIndex = filteredChunks.find((_, i) =>
            i == (selectedIndex - 1)
          )!.index;
        }
        break;
      case ARROW_DOWN:
        if (selectedIndex === filteredChunks.at(-1)!.index) {
          selectedIndex = 0;
        } else {
          selectedIndex = filteredChunks.find((_, i) =>
            i == (selectedIndex + 1)
          )!.index;
        }
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
      case DELETE:
        selectedIndex = 0;
        searchBuffer = searchBuffer.slice(0, -1);
        break;
      default:
        selectedIndex = 0;
        searchBuffer += string;
        break;
    }

    output.writeSync(encoder.encode(`\x1b[${length + 1}A`));
    output.writeSync(CLEAR_ALL);
  }

  if (clear) {
    output.writeSync(encoder.encode(`\x1b[${length + 1}A`));
    output.writeSync(CLEAR_ALL);
  }

  output.writeSync(SHOW_CURSOR);
  input.setRaw(false);

  return [...selectedIndexes].map((it) => values[it] as string);
}
