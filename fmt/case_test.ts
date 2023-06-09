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

Deno.test("toPascalCase: Convert a sentence into pascal case", () => {
    assertEquals(
        casing.toPascalCase("she turned me into a newt"), 
        "SheTurnedMeIntoANewt"
    );
    assertEquals(
        casing.toPascalCase("tis But a Scratch"), 
        "TisButAScratch"
    );
});

Deno.test("toSnakeCase: Throws in invalid inputs", () => {
    assertThrows(() => casing.toSnakeCase(undefined as any));
    assertThrows(() => casing.toSnakeCase(NaN as any));
    assertThrows(() => casing.toSnakeCase(Infinity as any));
    assertThrows(() => casing.toSnakeCase(10 as any));
});

Deno.test("toSnakeCase: An empty string is already snake case", () => {
    assertEquals(casing.toSnakeCase(''), '');
});

Deno.test("toSnakeCase: Convert a single word to snake case", () => {
    const SINGLE_WORD = "shruberry";
    const EXPECTED = "shruberry";
    assertEquals(casing.toSnakeCase(SINGLE_WORD), EXPECTED);
});

Deno.test("toSnakeCase: Convert a sentence into snake case", () => {
    assertEquals(
        casing.toSnakeCase("she turned me into a newt"), 
        "she_turned_me_into_a_newt"
    );
    assertEquals(
        casing.toSnakeCase("tis But a Scratch"), 
        "tis_but_a_scratch"
    );
});