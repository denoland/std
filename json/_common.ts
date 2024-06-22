// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { JsonValue } from "./types.ts";

/** JSON.parse with detailed error message. */
export function parse(text: string): JsonValue {
  try {
    return JSON.parse(text);
  } catch (error) {
    // Truncate the string so that it is within 30 lengths.
    const truncatedText = 30 < text.length ? `${text.slice(0, 30)}...` : text;
    throw new ((error as Error).constructor as ErrorConstructor)(
      `${(error as Error).message} (parsing: '${truncatedText}')`,
    );
  }
}
