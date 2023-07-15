import { MatcherContext, MatchResult } from "../types.ts";
import { assertNotEquals } from "../../assert/assert_not_equals.ts";
import { assertEquals } from "../../assert/assert_equals.ts";

/* Similar to assertEqual */
export function toEqual(context: MatcherContext, expect: unknown): MatchResult {
    if (context.isNot)
        return assertNotEquals(context.value, expect, context.customMessage);
    return assertEquals(context.value, expect, context.customMessage);
}