import * as casing from './case.ts';
import { assertEquals, assertThrows } from "../testing/asserts.ts";

Deno.test("toPascalCase: Throws in invalid inputs", () => {
    assertThrows(() => casing.toPascalCase(undefined as any));
    assertThrows(() => casing.toPascalCase(NaN as any));
    assertThrows(() => casing.toPascalCase(Infinity as any));
    assertThrows(() => casing.toPascalCase(10 as any));
});

Deno.test("toPascalCase: An empty string is already pascal case", () => {
    assertEquals(casing.toPascalCase(''), '');
});

Deno.test("toPascalCase: Convert a single word to pascal case", () => {
    const SINGLE_WORD = "shruberry";
    const EXPECTED = "Shruberry";
    assertEquals(casing.toPascalCase(SINGLE_WORD), EXPECTED);
});

Deno.test("toPascalCase: Convert a sentende into pascal case", () => {
    assertEquals(
        casing.toPascalCase("she turned me into a newt"), 
        "SheTurnedMeIntoANewt"
    );
    assertEquals(
        casing.toPascalCase("tis But a Scratch"), 
        "TisButAScratch"
    );
});
