import { isValidName } from "../utils.ts";
import * as XML from "../xml_types.ts";
import { extractAttributes, findClosingIndex } from "./tags.ts";

/**
 * Parses instructions.
 *
 * @param input The full XML document.
 * @param i The position where the instruction starts.
 * @returns {{value: XML.Instruction, next: number}}
 * The position where the instruction ends and the parsed instruction
 * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Comment
 */
export function parseComment(
  input: string,
  i: number
): { value: XML.Comment; next: number } {
  const trimmedInput = input.slice(i);

  // This points to the previous char of the closing tag
  // Also, this extra check for a trailing "-" is neccessary
  // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Comment
  const endTagIndex = trimmedInput.search(/[^-]-->/g);
  if (endTagIndex === -1) {
    throw new Error("The comment is not closed");
  }

  const value = trimmedInput.slice(4, endTagIndex + 1);

  return {
    value: { type: "comment", value },
    // `endTagIndex` is the length of the content and the starting tag
    // <!-- this comment -->
    // |  endTagIndex   |
    next: i + endTagIndex + 4,
  };
}

/**
 * Parses instructions.
 *
 * @param input The full XML document.
 * @param i The position where the instruction starts.
 * @returns {{value: XML.Instruction, next: number}}
 * The position where the instruction ends and the parsed instruction
 * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-PI
 */
export function parseInstruction(
  input: string,
  i: number
): { value: XML.Instruction; next: number } {
  const endIndex = findClosingIndex(input, "?>", i + 2);
  if (endIndex === -1) throw new Error("The instruction is not closed");

  const content = input.slice(i + 2, endIndex);

  const [name = "", ...rest] = content.split(" ");
  const value = rest.join(" ");

  if (!isValidName(name)) {
    throw new Error("The instruction name is invalid");
  }

  const parsedAsAttributes = extractAttributes(value);

  return {
    value: {
      type: "instruction",
      name,
      rawInstruction: value,
      parsedAsAttributes: parsedAsAttributes,
    },
    next: endIndex + 2,
  };
}
