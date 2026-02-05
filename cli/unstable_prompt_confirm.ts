// Copyright 2018-2026 the Deno authors. MIT license.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const LF = "\n".charCodeAt(0);
const CR = "\r".charCodeAt(0);
const BS = "\b".charCodeAt(0);
const DEL = 0x7f;

/**
 * Represents a possible value for the confirm prompt.
 *
 * @typeParam T The type of the value returned when this option is selected.
 */
export interface PromptConfirmValue<T> {
  /** The key the user types to select this option (e.g., "y", "n", "m"). */
  key: string;
  /** The display label shown in the prompt (e.g., "yes", "no", "maybe"). */
  label?: string;
  /** The value returned when this option is selected. */
  value: T;
}

/** Options for {@linkcode promptConfirm}. */
export interface PromptConfirmOptions {
  /**
   * The key of the default value when the user presses Enter without typing.
   *
   * @default {"n"}
   */
  default?: string;

  /** Clear the current line after the user's input. */
  clear?: boolean;
}

/** Default values for the confirm prompt. */
export const YES_NO_VALUES: PromptConfirmValue<boolean>[] = [
  { key: "y", value: true },
  { key: "n", value: false },
];

/**
 * Shows the given message and waits for the user's input. Returns the value
 * associated with the user's selection.
 *
 * The prompt shows the available options with the default option's key capitalized.
 * For example: `Continue? [y/N]` where `N` is capitalized to indicate the default.
 * If a label is provided, it's shown in parentheses: `[y (yes)/N (no)]`.
 *
 * The user can type either the key or the full label to select an option.
 *
 * @typeParam T The type of values that can be returned.
 * @param message The prompt message to show to the user.
 * @param values The possible values for the prompt.
 * @param options The options for the prompt.
 * @returns The value of the selected option, or `null` if stdin is not a TTY.
 *
 * @example Basic usage with YES_NO_VALUES
 * ```ts ignore
 * import { promptConfirm, YES_NO_VALUES } from "@std/cli/unstable-confirm";
 *
 * const shouldProceed = promptConfirm("Continue?", YES_NO_VALUES);
 * if (shouldProceed) {
 *   console.log("Continuing...");
 * }
 * // Displays: Continue? [y/N]
 * ```
 *
 * @example With default set to yes
 * ```ts ignore
 * import { promptConfirm, YES_NO_VALUES } from "@std/cli/unstable-confirm";
 *
 * const shouldProceed = promptConfirm("Continue?", YES_NO_VALUES, { default: "y" });
 * // Displays: Continue? [Y/n]
 * ```
 *
 * @example Custom values with labels
 * ```ts ignore
 * import { promptConfirm } from "@std/cli/unstable-confirm";
 *
 * const result = promptConfirm("Save changes?", [
 *   { key: "y", label: "yes", value: "save" },
 *   { key: "n", label: "no", value: "discard" },
 *   { key: "c", label: "cancel", value: "cancel" },
 * ], { default: "c" });
 * // Displays: Save changes? [y (yes)/n (no)/C (cancel)]
 * ```
 *
 * @example With clear option
 * ```ts ignore
 * import { promptConfirm, YES_NO_VALUES } from "@std/cli/unstable-confirm";
 *
 * const shouldProceed = promptConfirm("Delete file?", YES_NO_VALUES, { clear: true });
 * ```
 */
export function promptConfirm<T>(
  message: string,
  values: PromptConfirmValue<T>[],
  options: PromptConfirmOptions = {},
): T | null {
  const input = Deno.stdin;
  const output = Deno.stdout;

  if (!input.isTerminal()) {
    return null;
  }

  const defaultKey = options.default ?? "n";
  const { clear } = options;

  const defaultOption = values.find((v) =>
    v.key.toLowerCase() === defaultKey.toLowerCase()
  );

  const optionsDisplay = values.map((v) => {
    const isDefault = v.key.toLowerCase() === defaultKey.toLowerCase();
    const key = isDefault ? v.key.toUpperCase() : v.key.toLowerCase();
    return `${key}${v.label ? ` (${v.label})` : ""}$`;
  }).join("/");

  const prompt = `${message} [${optionsDisplay}] `;
  output.writeSync(encoder.encode(prompt));

  input.setRaw(true);
  try {
    const answer = readLineFromStdinSync();
    const trimmedAnswer = answer.trim().toLowerCase();

    if (trimmedAnswer === "") {
      return defaultOption?.value ?? values[0]!.value;
    }

    const selectedOption = values.find((v) =>
      v.key.toLowerCase() === trimmedAnswer ||
      v.label?.toLowerCase() === trimmedAnswer
    );

    if (selectedOption) {
      return selectedOption.value;
    }

    return defaultOption?.value ?? values[0]!.value;
  } finally {
    if (clear) {
      output.writeSync(encoder.encode("\r\x1b[K"));
    } else {
      output.writeSync(encoder.encode("\n"));
    }
    input.setRaw(false);
  }
}

function readLineFromStdinSync(): string {
  const c = new Uint8Array(1);
  const buf: number[] = [];

  while (true) {
    const n = Deno.stdin.readSync(c);
    if (n === null || n === 0) {
      break;
    }
    if (c[0] === CR || c[0] === LF) {
      break;
    }
    if (c[0] === BS || c[0] === DEL) {
      buf.pop();
    } else {
      buf.push(c[0]!);
    }
  }
  return decoder.decode(new Uint8Array(buf));
}
