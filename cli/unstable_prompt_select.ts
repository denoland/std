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

/**
 * Value for {@linkcode promptSelect}.
 * If an object, it must have a title and a value, else it can just be a string.
 *
 * @typeParam V The value of the underlying Entry, if any.
 */
export type PromptEntry<V = undefined> = V extends undefined ? string
  : PromptEntryWithValue<V>;

/**
 * A {@linkcode PromptEntry} with an underlying value.
 *
 * @typeParam V The value of the underlying Entry.
 */
export interface PromptEntryWithValue<V> {
  /** The label for this entry. */
  label: string;
  /** The underlying value representing this entry. */
  value: V;
}

const ETX = "\x03";
const ARROW_UP = "\u001B[A";
const ARROW_DOWN = "\u001B[B";
const CR = "\r";
const DELETE = "\u007F";

const MORE_CONTENT_BEFORE_INDICATOR = "...";
const MORE_CONTENT_AFTER_INDICATOR = "...";

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
 * @typeParam V The value of the underlying Entry, if any.
 * @param message The prompt message to show to the user.
 * @param values The values for the prompt.
 * @param options The options for the prompt.
 * @returns The string that was entered or `null` if stdin is not a TTY.
 *
 * @example Basic usage
 * ```ts ignore
 * import { promptSelect } from "@std/cli/unstable-prompt-select";
 *
 * const browser = promptSelect("Please select browser", [
 *   "Chrome",
 *   "Firefox",
 *   "Safari",
 * ], { clear: true });
 * ```
 *
 * @example With title and value
 * ```ts ignore
 * import { promptSelect } from "@std/cli/unstable-prompt-select";
 *
 * const browsers = promptSelect(
 *   "Please select browsers:",
 *   [{
 *     title: "safari",
 *     value: 1,
 *   }, {
 *     title: "chrome",
 *     value: 2,
 *   }, {
 *     title: "firefox",
 *     value: 3,
 *   }],
 *   { clear: true },
 * );
 * ```
 *
 * @example With multiple options
 * ```ts ignore
 * import { promptSelect } from "@std/cli/unstable-prompt-select";
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
export function promptSelect<V = undefined>(
  message: string,
  values: PromptEntry<V>[],
  options: PromptSelectOptions = {},
): PromptEntry<V> | null {
  if (!input.isTerminal()) return null;

  const SAFE_PADDING = 4;
  let {
    // Deno.consoleSize().rows - 3 because we need to output the message, the up arrow, the terminal line and the down arrow
    visibleLines = Math.min(
      Deno.consoleSize().rows - SAFE_PADDING,
      values.length,
    ),
    indicator = "❯",
  } = options;
  const PADDING = " ".repeat(indicator.length);
  const ARROW_PADDING = " ".repeat(indicator.length + 1);

  const indexedValues = values.map((value, absoluteIndex) => ({
    value,
    absoluteIndex,
  }));
  let activeIndex = 0;
  let selectedIndex = 0;
  let offset = 0;
  let clearLength = values.length + 1;

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
        return (typeof item.value === "string" ? item.value : item.value.label)
          .toLowerCase().includes(searchBuffer.toLowerCase());
      }
    });
    const visibleChunks = filteredChunks.slice(offset, visibleLines + offset);
    const length = visibleChunks.length;

    const hasUpArrow = offset !== 0;
    const hasDownArrow = (length + offset) < filteredChunks.length;

    if (hasUpArrow) {
      output.writeSync(
        encoder.encode(`${ARROW_PADDING}${MORE_CONTENT_BEFORE_INDICATOR}\r\n`),
      );
    }

    for (const [index, { absoluteIndex, value }] of visibleChunks.entries()) {
      const active = index === (activeIndex - offset);
      const start = active ? indicator : PADDING;
      if (active) {
        selectedIndex = absoluteIndex;
      }
      output.writeSync(
        encoder.encode(
          `${start} ${typeof value === "string" ? value : value.label}\r\n`,
        ),
      );
    }

    if (hasDownArrow) {
      output.writeSync(
        encoder.encode(`${ARROW_PADDING}${MORE_CONTENT_AFTER_INDICATOR}\r\n`),
      );
    }
    const n = input.readSync(buffer);
    if (n === null || n === 0) break;
    const string = decoder.decode(buffer.slice(0, n));

    switch (string) {
      case ETX:
        output.writeSync(SHOW_CURSOR);
        return Deno.exit(0);
      case ARROW_UP:
        if (activeIndex === 0) {
          activeIndex = filteredChunks.length - 1;
          offset = Math.max(filteredChunks.length - visibleLines, 0);
        } else {
          activeIndex--;
          offset = Math.max(offset - 1, 0);
        }
        break;
      case ARROW_DOWN:
        if (activeIndex === (filteredChunks.length - 1)) {
          activeIndex = 0;
          offset = 0;
        } else {
          activeIndex++;

          if (activeIndex >= visibleLines) {
            offset++;
          }
        }
        break;
      case CR:
      case " ":
        break loop;
      case DELETE:
        activeIndex = 0;
        searchBuffer = searchBuffer.slice(0, -1);
        break;
      default:
        activeIndex = 0;
        searchBuffer += string;
        break;
    }

    visibleLines = Math.min(
      Deno.consoleSize().rows - SAFE_PADDING,
      visibleLines,
    );

    clearLength = 1 + // message
      (hasUpArrow ? 1 : 0) +
      length +
      (hasDownArrow ? 1 : 0);

    output.writeSync(encoder.encode(`\x1b[${clearLength}A`));
    output.writeSync(CLEAR_ALL);
  }

  if (options.clear) {
    output.writeSync(encoder.encode(`\x1b[${clearLength}A`));
    output.writeSync(CLEAR_ALL);
  }

  output.writeSync(SHOW_CURSOR);
  input.setRaw(false);

  return values[selectedIndex] ?? null;
}
