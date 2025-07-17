// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * This function asks the terminal for the cursor's current position.
 * Information entered by the user will be discarded while requesting the cursor
 * position. The cursor position may have also moved in this time due to the
 * user entering information. Due to the sync nature of this function, it is
 * not recommended to use this function frequently. Instead
 * {@linkcode Ansi.saveCursorPosition} and
 * {@linkcode Ansi.restoreCursorPosition} should be used when possible.
 *
 * @returns The cursor position or null if the terminal is not a TTY.
 * @example Usage
 * ```ts ignore
 * import { Ansi } from "@std/cli/unstable-ansi";
 * import { askForCursorPositionSync } from "@std/cli/unstable-get-cursor";
 *
 * const { column, row } = askForCursorPositionSync()!;
 * await Deno.stderr.write(new TextEncoder().encode(
 *   Ansi.setCursorPosition() +
 *     "Hello World!" +
 *     Ansi.setCursorPosition(row, column),
 * ));
 * ```
 */
export function askForCursorPositionSync():
  | { row: number; column: number }
  | null {
  if (!Deno.stdin.isTerminal() || !Deno.stderr.isTerminal()) {
    return null;
  }
  Deno.stdin.setRaw(true, { cbreak: true });
  Deno.stderr.writeSync(Uint8Array.from([0x1b, 0x5b, 0x36, 0x6e])); // \x1b[6n
  const buffer = new Uint8Array(1024);
  while (true) {
    const x = Deno.stdin.readSync(buffer.subarray(32));
    const csi = findCSI(buffer.subarray(0, 32 + x!));
    if (csi?.final === 82) { // R
      Deno.stdin.setRaw(false);
      const [row, column] = new TextDecoder()
        .decode(csi.parameters)
        .split(";")
        .map((x) => parseInt(x));
      return { row: row!, column: column! };
    }
    buffer.set(buffer.subarray(buffer.length - 32));
  }
}

function findCSI(
  buffer: Uint8Array,
): { parameters: Uint8Array; intermediates: Uint8Array; final: number } | null {
  for (let i = 0; i < buffer.length - 1; ++i) {
    if (buffer[i] === 0x1b && buffer[i + 1] === 0x5b) {
      i += 2;
      const parameters = getRange(buffer.subarray(i), 0x30, 0x3f);
      i += parameters.length;
      const intermediates = getRange(buffer.subarray(i), 0x20, 0x2f);
      i += intermediates.length;
      const final = buffer[i];
      if (final != undefined && 0x40 <= final && final <= 0x7e) {
        return { parameters, intermediates, final };
      }
    }
  }
  return null;
}

function getRange(buffer: Uint8Array, min: number, max: number) {
  let i = 0;
  for (; i < buffer.length; ++i) {
    const byte = buffer[i]!;
    if (byte < min || max < byte) {
      return buffer.subarray(0, i);
    }
  }
  return buffer.subarray(0, i);
}
