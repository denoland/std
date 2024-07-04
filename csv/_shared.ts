/**
 * returns length of a string considering surrogate pairs
 * ```ts
 * function graphemeLength(s: string): number {
 *   return Array.from(s).length;
 * }
 * graphemeLength("🐱") // 1
 * "🐱".length // 2
 * ```
 */
export function graphemeLength(s: string): number {
  return Array.from(s).length;
}
