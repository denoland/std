/**
 * Returns a new collection with all entries of the given collection except the ones that have a nullish value
 *
 * ```ts
 * import { filterValuesNotNullish } from "./filter_values_not_nullish.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const values = {
 *   x: null,
 *   y: undefined,
 *   z: "hi",
 * }
 *
 * assertEquals(
 *   filterValuesNotNullish(values),
 *   { z: "hi" }
 * )
 * ```
 */
export function filterValuesNotNullish<T>(
  record: Record<string, T>,
): Record<string, NonNullable<T>> {
  const filteredRecord: Record<string, NonNullable<T>> = {};

  for (const i in record) {
    if (record[i] === null || record[i] === undefined) {
      // This needs to be empty for code to work
    } else {
      filteredRecord[i] = record[i] as NonNullable<T>;
    }
  }

  return filteredRecord;
}
