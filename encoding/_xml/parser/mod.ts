import { getPosition, isValidName } from "../utils.ts";
import { parseDoctype } from "./doctype.ts";
import { extractAttributes, findClosingIndex } from "./tags.ts";
import type * as XML from "../xml_types.ts";
import { parseComment, parseInstruction } from "./common_parsers.ts";

export interface AST {
  declaration: XML.Declaration | null;
  root: XML.Root;
}

/**
 * Parses an XML document into a AST.
 *
 * @param {string} input The XML document to parse.
 * @returns {ParseResult}
 */
export function rawXMLToAST(input: string): AST {
  let declaration: XML.Declaration | null = null;
  const root: XML.Root = [];
  const path: number[] = []; // The path of the current XML Element.

  let textAccum = "";

  const getCurrentElement = () => {
    let node: XML.Element | undefined;

    for (const index of path) {
      const child = node ? node.children[index] : root[index];
      if (child && child.type !== "element") {
        throw new Error("Something went wrong while parsing");
      }
      node = child;
    }

    return node;
  };

  const pushNode = (node: XML.Node) => {
    const parent = getCurrentElement();

    if (!parent) {
      // This should never happen, since it's already being checked
      // before this point. But it's here for type-safety.
      if (node.type === "text" || node.type === "cdata") {
        throw new Error("Something went wrong while parsing");
      }

      root.push(node);
    } else {
      parent.children.push(node);
    }
  };

  const pushAndEnterElement = (node: XML.Element) => {
    const parent = getCurrentElement();

    let newLength: number;

    if (!parent) {
      newLength = root.push(node);
    } else {
      newLength = parent.children.push(node);
    }

    path.push(newLength - 1);
  };

  const exitElement = (): void => void path.pop();

  const isRoot = () => path.length === 0;

  let i = 0;
  try {
    while (i < input.length) {
      const char = input[i];

      if (char === "<") {
        const nextChar = input[i + 1];

        if (textAccum.length > 0) {
          if (!isRoot()) {
            pushNode({
              type: "text",
              value: textAccum,
            });
          } else if (textAccum.trim().length > 0) {
            throw new Error(
              `Unexpected text "${textAccum.trim()}" at the root of the XML document.`
            );
          }

          textAccum = "";
        }

        // Parse <?instruction ?>
        if (nextChar === "?") {
          const { value, next } = parseInstruction(input, i);

          // Parse prolog
          if (value.name.toLowerCase() === "xml") {
            if (declaration) throw new Error("There can only be one prolog");
            if (root.length > 0)
              throw new Error("Prolog must at the top of the document");

            if (!value.parsedAsAttributes.version) {
              throw new Error("Missing version in prolog");
            }

            if (
              value.parsedAsAttributes.version !== "1.0" &&
              value.parsedAsAttributes.version !== "1.1"
            ) {
              throw new Error(
                `Invalid version "${value.parsedAsAttributes.version}" in prolog`
              );
            }

            if (
              value.parsedAsAttributes.standalone &&
              value.parsedAsAttributes.standalone !== "yes" &&
              value.parsedAsAttributes.standalone !== "no"
            ) {
              throw new Error(
                `Invalid value of standalone "${value.parsedAsAttributes.standalone}" in prolog`
              );
            }

            declaration = {
              version: value.parsedAsAttributes.version,
              encoding: value.parsedAsAttributes.encoding,
              standalone: value.parsedAsAttributes.standalone as "yes" | "no",
            };
          } else {
            // Add instruction
            pushNode(value);
          }

          i = next;
        } else if (nextChar === "!") {
          if (input.slice(i, i + 4) === "<!--") {
            const comment = parseComment(input, i);

            pushNode(comment.value);
            i = comment.next;
          } else if (input.slice(i, i + 9) === "<![CDATA[") {
            if (isRoot()) {
              throw new Error(
                `Unexpected CDATA "${textAccum.trim()}" at the root of the XML document.`
              );
            }

            const endTagIndex = input.indexOf("]]>", i + 9);
            if (endTagIndex === -1) {
              throw new Error("CDATA is not closed");
            }

            const value = input.slice(i + 9, endTagIndex);

            pushNode({
              type: "cdata",
              value,
            });

            i = endTagIndex + 3;
          } else if (input.slice(i, i + 9) === "<!DOCTYPE") {
            if (!isRoot()) {
              throw new Error("DOCTYPE must at the root of the document");
            }

            for (const node of root) {
              if (node.type === "doctype") {
                throw new Error("There can only be one DOCTYPE");
              }
              if (node.type !== "comment" && node.type !== "instruction") {
                throw new Error("DOCTYPE must be before any element");
              }
            }

            const result = parseDoctype(input, i);
            root.push(result.doctype);
            i = result.next;
          } else {
            throw new Error("Invalid tag");
          }
        } else if (nextChar === "/") {
          // Parse end tag
          const endTagIndex = findClosingIndex(input, ">", i + 2);
          if (endTagIndex === -1) throw new Error("The tag is not closed");

          // The end tag can have leading whitespaces, hence the .trimEnd()
          // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-ETag
          const name = input.slice(i + 2, endTagIndex).trimEnd();

          const currentElement = getCurrentElement();
          if (!currentElement || currentElement.name !== name) {
            throw new Error(
              "The ending tag does not match the current element"
            );
          }

          exitElement();

          i = endTagIndex + 1;
        } else {
          // Parse start tag
          if (isRoot() && root.find((node) => node.type === "element")) {
            throw new Error("More than one root element found");
          }

          const endTagIndex = findClosingIndex(input, ">", i + 1);
          if (endTagIndex === -1) throw new Error("The tag is not closed");

          let tagContent = input.slice(i + 1, endTagIndex);

          let selfClosing = false;
          if (tagContent.at(-1) === "/") {
            selfClosing = true;
            tagContent = tagContent.slice(0, -1);
          }

          const [name = "", ...rest] = tagContent.split(" ");
          const rawAttributes = rest.join(" ");

          if (!isValidName(name)) {
            throw new Error("The element name is invalid");
          }

          const attributes = extractAttributes(rawAttributes);

          const element: XML.Element = {
            type: "element",
            name,
            attributes,
            children: [],
          };

          if (selfClosing) {
            // If the tag is self-closing, we don't need to enter it.
            pushNode(element);
          } else {
            pushAndEnterElement(element);
          }

          i = endTagIndex + 1;
        }
      } else {
        textAccum += char;
        i++;
      }
    }

    if (textAccum.length > 0) {
      if (!isRoot()) {
        pushNode({
          type: "text",
          value: textAccum,
        });
      } else if (textAccum.trim().length > 0) {
        throw new Error(
          `Unexpected text "${textAccum.trim()}" at the root of the XML document.`
        );
      }

      textAccum = "";
    }
  } catch (error) {
    const message = `Error parsing XML at ${getPosition(input, i)}`;

    if (error instanceof Error) {
      throw new Error(message, { cause: error });
    } else {
      throw new Error(message);
    }
  }

  return { declaration, root };
}
