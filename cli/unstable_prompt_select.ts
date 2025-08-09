// Copyright 2018-2025 the Deno authors. MIT license.

import { handlePromptSelect } from "./_prompt_select.ts";

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

const input = Deno.stdin;

/**
 * Shows the given message and waits for the user's input. Returns the user's selected value as string.
 *
 * Also supports filtering of the options by typing.
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

  let selectedIndex = 0;

  handlePromptSelect(
    message,
    options.indicator ?? "❯",
    values,
    options.clear,
    options.visibleLines,
    (active, absoluteIndex) => {
      if (active) {
        selectedIndex = absoluteIndex;
      }
    },
    (str, _absoluteIndex, {
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
        case " ":
          return true;
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

  return values[selectedIndex] ?? null;
}
