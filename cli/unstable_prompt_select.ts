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
const DELETE = "\u007F";

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

  const SAFE_PADDING = 3;
  let {
    // Deno.consoleSize().rows - 3 because we need to output the message, the terminal line
    // and we use the last line to display the "..."
    visibleLines = Math.min(
      Deno.consoleSize().rows - SAFE_PADDING,
      values.length,
    ),
    indicator = "❯",
  } = options;
  const PADDING = " ".repeat(indicator.length);

  let displayedLines = 0;
  let selectedIndex = 0;
  let showIndex = 0;
  let offset = 0;

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
    const filteredChunks = values.filter((item) => {
      if (searchBuffer === "") {
        return true;
      } else {
        return item.toLowerCase().includes(searchBuffer.toLowerCase());
      }
    });
    const chunk = filteredChunks.slice(offset, visibleLines + offset);
    displayedLines = chunk.length;
    const length = filteredChunks.length;
    for (const [index, value] of chunk.entries()) {
      const start = index === showIndex ? indicator : PADDING;
      output.writeSync(encoder.encode(`${start} ${value}\r\n`));
    }
    const moreContent = displayedLines + offset < length;
    if (moreContent) {
      output.writeSync(encoder.encode("...\r\n"));
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
          offset = Math.max(length - displayedLines, 0);
          showIndex = Math.min(displayedLines - 1, length - 1);
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
        } else if (showIndex < displayedLines - 1) {
          showIndex++;
        } else {
          offset++;
        }
        break;
      }
      case CR:
        break loop;
      case DELETE:
        searchBuffer = searchBuffer.slice(0, -1);
        break;
      default:
        searchBuffer += string;
        break;
    }

    visibleLines = Math.min(
      Deno.consoleSize().rows - SAFE_PADDING,
      visibleLines,
    );
    // if we print the "...\r\n" we need to clear an additional line
    output.writeSync(
      encoder.encode(`\x1b[${displayedLines + (moreContent ? 2 : 1)}A`),
    );
    output.writeSync(CLR_ALL);
  }

  if (options.clear) {
    output.writeSync(encoder.encode(`\x1b[${displayedLines + 1}A`));
    output.writeSync(CLR_ALL);
  }

  output.writeSync(SHOW_CURSOR);
  input.setRaw(false);

  return values[selectedIndex] ?? null;
}
