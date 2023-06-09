/**
 * Converts a str into PascalCase
 * 
 * @example
 * ```ts
 * import {
 *  toPascalCase,
 * } from "https://deno.land/std@$STD_VERSION/fmt/case.ts"
 * 
 * assertEquals(toPascalCase("deno is awesome"), "DenoIsAwesome")
 * ```
 * 
 * @param str is the string that is going to be converted into PascalCase
 * @returns The string as PascalCase
 */
export function toPascalCase(str: string): string {
    if (typeof str !== "string") {
        throw new TypeError("str must be a string");
    }

    if (str === "") {
        return "";
    }

    return str.split(" ").map(capitalizeWord).join("");
}

function capitalizeWord(word: string): string {
    const firstChar = word[0];
    const firstCharAsUpperCase = firstChar.toLocaleUpperCase();
    const restOfTheString = word.slice(1).toLocaleLowerCase();
    return firstCharAsUpperCase + restOfTheString;
}
