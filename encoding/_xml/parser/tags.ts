import { isWhiteSpace, isValidName } from "../utils.ts";
import type * as XML from "../xml_types.ts";

type ExtractAttributesState =
  | { parsing: "nothing" }
  | { parsing: "name"; name: string }
  | { parsing: "eq"; name: string; eqFound: boolean }
  | { parsing: "value"; name: string; value: string; quote: string };

/**
 * Extract attributes from a XML element.
 *
 * @param {string} input
 * The input must be only the attributes, without the element name.
 * For example, if you want to parse the element `<foo bar="baz" qux="quux">`, you must pass the string `bar="baz" qux="quux"`.
 *
 * @returns {XML.Attributes}
 * For example, if the input is `"name='value'"`, the output will be `{ name: "value" }`.
 */
export function extractAttributes(input: string): XML.Attributes {
  const attributes: XML.Attributes = {};

  let state: ExtractAttributesState = { parsing: "nothing" };
  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    switch (state.parsing) {
      case "nothing": {
        if (!isWhiteSpace(char)) {
          state = { parsing: "name", name: char };
        }
        break;
      }

      case "name": {
        if (char === "=" || isWhiteSpace(char)) {
          if (!isValidName(state.name)) {
            throw new Error(`Invalid attribute name "${state.name}"`);
          }
          if (state.name in attributes) {
            throw new Error(`Attribute "${state.name}" already exists`);
          }
          state = { parsing: "eq", name: state.name, eqFound: char === "=" };
        } else {
          state.name += char;
        }
        break;
      }

      case "eq": {
        // There could be an attribute like `attr   =    "value"`, hence this validation.
        if (isWhiteSpace(char)) {
          continue;
        } else if (char === "=") {
          // Throw if more than one `=` is found.
          if (state.eqFound) {
            throw new Error(`Invalid attribute "${state.name}"`);
          }
          state.eqFound = true;
        } else if (char === '"' || char === "'") {
          state = {
            parsing: "value",
            name: state.name,
            value: "",
            quote: char,
          };
        } else {
          throw new Error(
            `Unexpected character "${char}" in attribute "${state.name}"`
          );
        }
        break;
      }

      case "value": {
        if (char === state.quote) {
          attributes[state.name] = state.value;
          state = { parsing: "nothing" };
        } else {
          state.value += char;
        }
        break;
      }
    }
  }

  return attributes;
}

/**
 * Find the index of the end of a XML node. It takes attributes into account.
 *
 * @param {string} input
 * The input should be the XML node.
 *
 * @param {string} ending
 * The ending is the closing tag of the element.
 * For example, if you want to find the ending of the element `<foo>`, the ending should be `</foo>`.
 *
 * @param {number} [startAt=0]
 * The index to start searching from.
 *
 * @returns {number}
 * It will return the index where the ending starts. If the ending is not found, it will return `-1`.
 *
 * @example
 * findClosingIndex('<?xml version="1.0" ?>', "?>") // => 20
 * findClosingIndex('<plot condition="x > 5" >', ">") // => 24
 * findClosingIndex('no closing tag', "?>") // => -1
 */
export function findClosingIndex(
  input: string,
  ending: string,
  startAt: number = 0
): number {
  if (ending.length === 0) {
    return -1;
  }

  const firstEndingChar = ending[0];

  let insideText: '"' | "'" | false = false;
  for (let i = startAt; i < input.length; i++) {
    const char = input[i];

    if (insideText) {
      if (char === insideText) {
        insideText = false;
      }
    } else {
      if (char === '"' || char === "'") {
        insideText = char;
      } else if (char === firstEndingChar) {
        if (input.slice(i, i + ending.length) === ending) {
          return i;
        }
      }
    }
  }

  return -1;
}
