// Copyright 2018-2025 the Deno authors. MIT license.

/** Options for {@linkcode promptMultipleSelect}. */
export interface PromptMultipleSelectOptions {
  /** Clear the lines after the user's input. */
  clear?: boolean;

  /** The number of lines to be visible at once */
  visibleLines?: number;

  /** The string to indicate the selected item */
  indicator?: string;
}

/**
 * Value for {@linkcode promptMultipleSelect}.
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

const MORE_CONTENT_BEFORE_INDICATOR = "...";
const MORE_CONTENT_AFTER_INDICATOR = "...";

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
 * @typeParam V The value of the underlying Entry, if any.
 * @param message The prompt message to show to the user.
 * @param values The values for the prompt.
 * @param options The options for the prompt.
 * @returns The selected values as an array of strings or `null` if stdin is not a TTY.
 *
 * @example Usage
 * ```ts ignore
 * import { promptMultipleSelect } from "@std/cli/unstable-prompt-multiple-select";
 *
 * const browsers = promptMultipleSelect(
 *   "Please select browsers:",
 *   ["safari", "chrome", "firefox"],
 *   { clear: true },
 * );
 * ```
 *
 * @example With title and value
 * ```ts ignore
 * import { promptMultipleSelect } from "@std/cli/unstable-prompt-multiple-select";
 *
 * const browsers = promptMultipleSelect(
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
 * import { promptMultipleSelect } from "@std/cli/unstable-prompt-multiple-select";
 *
 * const browsers = promptMultipleSelect(
 *   "Select your favorite numbers below 100:",
 *   [...Array(100).keys()].map(String),
 *   { clear: true, visibleLines: 5, indicator: "→" },
 * );
 * ```
 */
export function promptMultipleSelect<V = undefined>(
  message: string,
  values: PromptEntry<V>[],
  options: PromptMultipleSelectOptions = {},
): PromptEntry<V>[] | null {
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

  const length = values.length;
  let selectedIndex = 0;
  const selectedIndexes = new Set<number>();
  let showIndex = 0;
  let offset = 0;

  input.setRaw(true);
  output.writeSync(HIDE_CURSOR);

  const buffer = new Uint8Array(4);

  let hasUpArrow = false;

  loop:
  while (true) {
    output.writeSync(encoder.encode(`${message}\r\n`));
    const chunk = values.slice(offset, visibleLines + offset);

    const hasDownArrow = visibleLines + offset < length;

    if (offset !== 0) {
      output.writeSync(
        encoder.encode(`${ARROW_PADDING}${MORE_CONTENT_BEFORE_INDICATOR}\r\n`),
      );
    }

    for (const [index, value] of chunk.entries()) {
      const realIndex = offset + index;
      const start = index === showIndex ? indicator : PADDING;
      const checked = selectedIndexes.has(realIndex);
      const state = checked ? CHECKED : UNCHECKED;
      output.writeSync(
        encoder.encode(
          `${start} ${state} ${
            typeof value === "string" ? value : value.label
          }\r\n`,
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
      case ARROW_UP: {
        const atTop = selectedIndex === 0;
        selectedIndex = atTop ? length - 1 : selectedIndex - 1;
        if (atTop) {
          offset = Math.max(length - visibleLines, 0);
          showIndex = Math.min(visibleLines - 1, length - 1);
        } else if (showIndex > 0) {
          showIndex--;
        } else {
          offset = Math.max(offset - 1, 0);
        }
        break;
      }
      case ARROW_DOWN: {
        const atBottom = selectedIndex === length - 1;
        selectedIndex = atBottom ? 0 : selectedIndex + 1;
        if (atBottom) {
          offset = 0;
          showIndex = 0;
        } else if (showIndex < visibleLines - 1) {
          showIndex++;
        } else {
          offset++;
        }
        break;
      }
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

    visibleLines = Math.min(
      Deno.consoleSize().rows - SAFE_PADDING,
      visibleLines,
    );

    output.writeSync(
      encoder.encode(
        `\x1b[${
          1 + // message
          (hasUpArrow ? 1 : 0) +
          visibleLines +
          (hasDownArrow ? 1 : 0)
        }A`,
      ),
    );

    output.writeSync(CLEAR_ALL);
    hasUpArrow = offset !== 0;
  }

  if (options.clear) {
    output.writeSync(encoder.encode(`\x1b[${visibleLines + 1}A`));
    output.writeSync(CLEAR_ALL);
  }

  output.writeSync(SHOW_CURSOR);
  input.setRaw(false);

  return [...selectedIndexes].map((it) => values[it]!);
}
