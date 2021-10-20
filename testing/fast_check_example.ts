/**
 * Run this example with:
 *
 * If using the nested testing API, use the unstable flag as indicated in the command below
 * deno test --unstable ./testing/fast_check_example.ts
 */

import fc from "https://cdn.skypack.dev/fast-check";

function lowercaseString(text: string): string {
  return text.toLowerCase();
}

function add(a: number, b: number): number {
  return a + b;
}

function absoluteAddition(a: number, b: number): number {
  return Math.abs(a) + Math.abs(b);
}

// Using the Nested testing API from Deno 1.15
Deno.test("can use fast check for property based testing", async (t) => {
  await t.step("string after lower case should be of same length", async () => {
    fc.assert(
      fc.property(
        fc.string(),
        (text: string) => text.length === lowercaseString(text).length,
      ),
    );
  });

  await t.step(
    "absolute addition should always be greater or equal to regular addition",
    async () => {
      fc.assert(
        fc.property(
          fc.integer(-99, 99),
          fc.integer(-99, 99),
          (a: number, b: number) => add(a, b) <= absoluteAddition(a, b),
        ),
      );
    },
  );

  await t.step("string should contain itself", async () => {
    fc.assert(fc.property(fc.string(), (text: string) => text.includes(text)));
  });

  await t.step("string must contain substring", async () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.string(),
        (a: string, b: string, c: string) => (a + b + c).includes(b),
      ),
    );
  });
});
