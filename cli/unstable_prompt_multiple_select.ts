// Copyright 2018-2026 the Deno authors. MIT license.

import { handlePromptSelect } from "./_prompt_select.ts";

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

const DELETE = "\u007F";

const CHECKED = "◉";
const UNCHECKED = "◯";

/**
 * Shows the given message and waits for the user's input. Returns the user's selected value as string.
 *
 * Also supports filtering of the options by typing.
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
 *     label: "safari",
 *     value: 1,
 *   }, {
 *     label: "chrome",
 *     value: 2,
 *   }, {
 *     label: "firefox",
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
  if (!Deno.stdin.isTerminal()) return null;

  const selectedAbsoluteIndexes = new Set<number>();

  handlePromptSelect(
    message,
    options.indicator ?? "❯",
    values,
    options.clear,
    options.visibleLines,
    (_active, absoluteIndex) => {
      const checked = selectedAbsoluteIndexes.has(absoluteIndex);
      return checked ? CHECKED : UNCHECKED;
    },
    (str, absoluteIndex, {
      etx,
      up,
      down,
      remove,
      inputStr,
    }) => {
      switch (str) {
        case ETX:
          return etx();
        case ARROW_UP:
          up();
          break;
        case ARROW_DOWN:
          down();
          break;
        case CR:
          return true;
        case " ": {
          if (absoluteIndex !== undefined) {
            if (selectedAbsoluteIndexes.has(absoluteIndex)) {
              selectedAbsoluteIndexes.delete(absoluteIndex);
            } else {
              selectedAbsoluteIndexes.add(absoluteIndex);
            }
          }
          break;
        }
        case DELETE:
          remove();
          break;
        default:
          inputStr();
          break;
      }

      return false;
    },
  );

  return [...selectedAbsoluteIndexes].map((it) => values[it]!);
}
