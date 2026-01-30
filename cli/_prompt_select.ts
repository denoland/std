// Copyright 2018-2026 the Deno authors. MIT license.

import type { PromptEntry } from "./unstable_prompt_select.ts";

const SAFE_PADDING = 4;

const MORE_CONTENT_BEFORE_INDICATOR = "...";
const MORE_CONTENT_AFTER_INDICATOR = "...";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const CLEAR_ALL = encoder.encode("\x1b[J"); // Clear all lines after cursor
const HIDE_CURSOR = encoder.encode("\x1b[?25l");
const SHOW_CURSOR = encoder.encode("\x1b[?25h");
const QUERY_CURSOR_POSITION = encoder.encode("\x1b[6n");

/**
 * @param message The prompt message to show to the user.
 * @param indicator The string to indicate the selected item.
 * @param values The values for the prompt.
 * @param clear Whether to clear the lines after the user's input.
 * @param visibleLinesInit The initial number of lines to be visible at once.
 * @param fitToRemainingHeight Whether to calculate visible lines based on remaining height from cursor position.
 * @param valueChange A function that is called when the value changes.
 * @param handleInput A function that handles the input from the user. If it returns false, the prompt will continue. If it returns true, the prompt will exit with clean ups of terminal state (Use this for finalizing the selection). If it returns "return", the prompt will exit immediately without clean ups of terminal state (Use this for exiting the program).
 */
export function handlePromptSelect<V>(
  message: string,
  indicator: string,
  values: PromptEntry<V>[],
  clear: boolean | undefined,
  visibleLinesInit: number | undefined,
  fitToRemainingHeight: boolean | undefined,
  valueChange: (active: boolean, absoluteIndex: number) => string | void,
  handleInput: (str: string, absoluteIndex: number | undefined, actions: {
    etx(): "return";
    up(): void;
    down(): void;
    remove(): void;
    inputStr(): void;
  }) => boolean | "return",
) {
  const input = Deno.stdin;
  const output = Deno.stdout;
  const indexedValues = values.map((value, absoluteIndex) => ({
    value,
    absoluteIndex,
  }));
  let clearLength = indexedValues.length + 1;

  const PADDING = " ".repeat(indicator.length);
  const ARROW_PADDING = " ".repeat(indicator.length + 1);

  let activeIndex = 0;
  let offset = 0;
  let searchBuffer = "";
  const buffer = new Uint8Array(4);

  input.setRaw(true);
  output.writeSync(HIDE_CURSOR);

  let availableHeight = Deno.consoleSize().rows - SAFE_PADDING;
  if (fitToRemainingHeight) {
    const cursorRow = getCursorRow(input, output);
    if (cursorRow !== undefined) {
      availableHeight = Deno.consoleSize().rows - cursorRow - SAFE_PADDING + 1;
    }
  }

  let visibleLines = visibleLinesInit ?? Math.min(
    availableHeight,
    values.length,
  );

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

    for (
      const [
        index,
        {
          absoluteIndex,
          value,
        },
      ] of visibleChunks.entries()
    ) {
      const active = index === (activeIndex - offset);
      const start = active ? indicator : PADDING;
      const maybePrefix = valueChange(active, absoluteIndex);
      output.writeSync(
        encoder.encode(
          `${start}${maybePrefix ? ` ${maybePrefix}` : ""} ${
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

    const processedInput = handleInput(
      string,
      filteredChunks[activeIndex]?.absoluteIndex,
      {
        etx: () => {
          output.writeSync(SHOW_CURSOR);
          Deno.exit(0);
          return "return";
        },
        up: () => {
          if (activeIndex === 0) {
            activeIndex = filteredChunks.length - 1;
            offset = Math.max(filteredChunks.length - visibleLines, 0);
          } else {
            activeIndex--;
            offset = Math.max(offset - 1, 0);
          }
        },
        down: () => {
          if (activeIndex === (filteredChunks.length - 1)) {
            activeIndex = 0;
            offset = 0;
          } else {
            activeIndex++;

            if (activeIndex >= visibleLines) {
              offset++;
            }
          }
        },
        remove: () => {
          activeIndex = 0;
          searchBuffer = searchBuffer.slice(0, -1);
        },
        inputStr: () => {
          activeIndex = 0;
          searchBuffer += string;
        },
      },
    );

    if (processedInput === "return") {
      return;
    } else if (processedInput) {
      break;
    }

    if (fitToRemainingHeight) {
      availableHeight = Math.min(
        availableHeight,
        Deno.consoleSize().rows - SAFE_PADDING,
      );
    } else {
      availableHeight = Deno.consoleSize().rows - SAFE_PADDING;
    }
    visibleLines = Math.min(availableHeight, visibleLines);

    clearLength = 1 + // message
      (hasUpArrow ? 1 : 0) +
      length +
      (hasDownArrow ? 1 : 0);

    output.writeSync(encoder.encode(`\x1b[${clearLength}A`));
    output.writeSync(CLEAR_ALL);
  }

  if (clear) {
    output.writeSync(encoder.encode(`\x1b[${clearLength}A`));
    output.writeSync(CLEAR_ALL);
  }

  output.writeSync(SHOW_CURSOR);
  input.setRaw(false);
}

function getCursorRow(
  input: typeof Deno.stdin,
  output: typeof Deno.stdout,
): number | undefined {
  output.writeSync(QUERY_CURSOR_POSITION);

  const buffer = new Uint8Array(32);
  const n = input.readSync(buffer);
  if (n === null || n === 0) return undefined;

  const response = decoder.decode(buffer.subarray(0, n)).trim();

  // deno-lint-ignore no-control-regex
  const match = response.match(/\x1b\[(\d+);(\d+)R/);
  if (match) {
    return parseInt(match[1]!, 10);
  }
  return undefined;
}
