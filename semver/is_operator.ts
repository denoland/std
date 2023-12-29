// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { operators } from "./_shared.ts";
import { Operator } from "./types.ts";

/**
 * Checks to see if the value is a valid Operator string.
 *
 * Adds a type assertion if true.
 * @param value The value to check
 * @returns True if the value is a valid Operator string otherwise false.
 */
export function isOperator(value: unknown): value is Operator {
  return operators.includes(value as Operator);
}
