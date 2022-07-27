import {
  getPosition,
  isValidName,
  isWhiteSpace,
  whiteSpaceCleaner,
} from "../utils.ts";
import type * as XML from "../xml_types.ts";
import { parseComment, parseInstruction } from "./common_parsers.ts";

/**
 * Parses DOCTYPE declarations and adds new entities to the entities map.
 *
 * @param input The full XML document.
 * @param i The position where the DOCTYPE declaration starts.
 * @returns {{next: number, doctype: XML.DocType}}
 * The position where the DOCTYPE declaration ends and the parsed DOCTYPE
 * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-doctypedecl
 */
export function parseDoctype(
  input: string,
  i: number
): { next: number; doctype: XML.DocType } {
  try {
    i += 9; // "<!DOCTYPE".length;

    i = whiteSpaceCleaner(input, i, true);

    let name = "";
    while (!isWhiteSpace(input[i]) && input[i] !== ">") {
      name += input[i];
      i++;
    }

    if (!isValidName(name)) throw new Error("Invalid DOCTYPE name");

    i = whiteSpaceCleaner(input, i);

    const doctype: XML.DocType = {
      type: "doctype",
      name,
    };

    if (input[i] === ">") {
      return { next: i + 1, doctype };
    }

    const externalId = parseExternalId(input, i);
    if (externalId) {
      if (typeof externalId.value.systemId !== "string") {
        throw new Error(`Malformed DOCTYPE declaration, missing system ID`);
      }

      // @ts-expect-error - There will be a systemId if type is PUBLIC, but TS doesn't know that
      doctype.externalId = externalId.value;

      i = externalId.next;
    }

    if (input[i] === "[") {
      return parseDoctypeDeclarations(input, i, doctype);
    } else if (input[i] === ">") {
      return { next: i + 1, doctype };
    } else {
      throw new Error(`Illegal character "${input[i]}"`);
    }
  } catch (error) {
    const message = `Error parsing DOCTYPE at ${getPosition(input, i)}`;

    if (error instanceof Error) {
      throw new Error(message, { cause: error });
    } else {
      throw new Error(message);
    }
  }
}

function parseURILiteral(
  input: string,
  i: number
): { value: string; next: number } {
  const quote = input[i];
  if (quote !== "'" && quote !== '"') {
    throw new Error(`Illegal character "${input[i]}", expected ' or "`);
  }

  i++;

  let value = "";
  while (input[i] !== quote) {
    value += input[i];
    i++;
  }

  i++;

  return { value, next: i };
}

function parseExternalId(
  input: string,
  i: number
): {
  value: XML.ExternalId<false>;
  next: number;
} | null {
  if (input.slice(i).startsWith("SYSTEM")) {
    i += 6; // "SYSTEM".length;

    i = whiteSpaceCleaner(input, i, true);

    const systemId = parseURILiteral(input, i);
    i = systemId.next;

    i = whiteSpaceCleaner(input, i);

    return {
      value: { type: "SYSTEM", systemId: systemId.value },
      next: i,
    };
  } else if (input.slice(i).startsWith("PUBLIC")) {
    i += 6; // "PUBLIC".length;

    i = whiteSpaceCleaner(input, i, true);

    const publicId = parseURILiteral(input, i);
    i = publicId.next;

    // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-PubidLiteral
    if (/^[\s\w'()+,./:=?;!*#@$%]*$/.test(publicId.value)) {
      throw new Error(`Invalid public ID "${publicId.value}"`);
    }

    i = whiteSpaceCleaner(input, i, true);

    const systemId = parseURILiteral(input, i);
    i = systemId.next;

    i = whiteSpaceCleaner(input, i);

    return {
      next: i,
      value: {
        type: "PUBLIC",
        publicId: publicId.value,
        systemId: systemId.value,
      },
    };
  } else {
    return null;
  }
}

// https://www.w3.org/TR/2008/REC-xml-20081126/#NT-intSubset
function parseDoctypeDeclarations(
  input: string,
  i: number,
  doctype: XML.DocType
): { next: number; doctype: XML.DocType } {
  i++; // Skip the opening bracket

  const declarations: XML.DoctypeDeclaration[] = [];

  while (input[i] !== "]") {
    const char = input[i];

    if (isWhiteSpace(char)) {
      i++;
    } else if (char === "%") {
      // Parse reference
      // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-PEReference
      const endIndex = input.indexOf(";", i);
      const name = input.slice(i + 1, endIndex);

      if (!isValidName(name)) {
        throw new Error(`Invalid reference name "${name}"`);
      }

      declarations.push({ type: "reference", name });
    } else if (char === "<") {
      const nextChar = input[i + 1];

      if (nextChar === "?") {
        const instruction = parseInstruction(input, i);

        declarations.push(instruction.value);
        i = instruction.next;
      } else if (nextChar === "!") {
        if (input.slice(i, i + 4) === "<!--") {
          const comment = parseComment(input, i);
          declarations.push(comment.value);
          i = comment.next;
        } else if (input.slice(i, i + 9) === "<!ELEMENT") {
          // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-elementdecl
          i += 9;

          i = whiteSpaceCleaner(input, i, true);

          let name = "";
          while (!isWhiteSpace(input[i])) {
            name += input[i];
            i++;
          }

          if (!isValidName(name)) throw new Error("Invalid ELEMENT name");

          i = whiteSpaceCleaner(input, i, true);

          // NOTE: This isn't beign validated
          // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-contentspec
          let content = "";
          while (input[i] !== ">") {
            content += input[i];
            i++;
          }

          // Remove possible white space before the closing >
          content = content.slice(0, -1).trimEnd() + ">";

          declarations.push({ type: "element-declaration", name, content });

          i++;
        } else if (input.slice(i, i + 9) === "<!ATTLIST") {
          // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-AttlistDecl
          i += 9;

          i = whiteSpaceCleaner(input, i, true);

          let name = "";
          while (!isWhiteSpace(input[i]) && input[i] !== ">") {
            name += input[i];
            i++;
          }

          if (!isValidName(name)) throw new Error("Invalid ATTLIST name");

          i = whiteSpaceCleaner(input, i);

          if (input[i] === ">") {
            declarations.push({ type: "attlist-declaration", name });
          } else {
            // NOTE: This isn't beign validated
            // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-AttDef
            let definitions = "";
            while (input[i] !== ">") {
              definitions += input[i];
              i++;
            }

            // Remove possible white space before the closing >
            definitions = definitions.slice(0, -1).trimEnd() + ">";

            declarations.push({
              type: "attlist-declaration",
              name,
              definitions,
            });
          }

          i++;
        } else if (input.slice(i, i + 8) === "<!ENTITY") {
          // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-EntityDecl
          i += 8;

          i = whiteSpaceCleaner(input, i, true);

          const type = input[i] === "%" ? "parameter" : "general";

          if (type === "parameter") {
            i = whiteSpaceCleaner(input, i + 1, true);
          }

          let name = "";
          while (!isWhiteSpace(input[i])) {
            name += input[i];
            i++;
          }

          if (!isValidName(name)) throw new Error("Invalid ENTITY name");

          i = whiteSpaceCleaner(input, i, true);

          if (input[i] === "'" || input[i] === '"') {
            // interal
            const quote = input[i];
            i++;

            let value = "";
            while (input[i] !== quote) {
              value += input[i];
              i++;
            }

            i = whiteSpaceCleaner(input, i + 1);

            if (input[i] !== ">") {
              throw new Error(
                `Expected '>' after ENTITY declaration, got '${input[i]}'`
              );
            }

            declarations.push({
              type: "entity-declaration",
              name,
              entityType: `${type}-internal`,
              value,
            });
          } else {
            // external
            const externalId = parseExternalId(input, i);
            if (!externalId || typeof externalId.value.systemId !== "string") {
              throw new Error("Malformed ENTITY");
            }
            i = externalId.next;

            let ndata: string | undefined;

            if (type === "general" && input.slice(i, i + 5) === "NDATA") {
              i += 5;
              i = whiteSpaceCleaner(input, i, true);

              ndata = "";
              while (!isWhiteSpace(input[i]) && input[i] !== ">") {
                ndata += input[i];
                i++;
              }

              if (!isValidName(ndata)) throw new Error("Invalid NDATA");

              i = whiteSpaceCleaner(input, i);
            }

            if (input[i] !== ">") {
              throw new Error(
                `Expected '>' after ENTITY declaration, got '${input[i]}'`
              );
            }

            if (type === "parameter") {
              declarations.push({
                type: "entity-declaration",
                name,
                entityType: "parameter-external",
                // @ts-expect-error - There will be a systemId if type is PUBLIC, but TS doesn't know that
                externalId: externalId.value,
              });
            } else {
              declarations.push({
                type: "entity-declaration",
                name,
                entityType: "general-external",
                // @ts-expect-error - There will be a systemId if type is PUBLIC, but TS doesn't know that
                externalId: externalId.value,
                ndata,
              });
            }
          }

          i++;
        } else if (input.slice(i, i + 10) === "<!NOTATION") {
          // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-NotationDecl
          i += 10;

          i = whiteSpaceCleaner(input, i, true);

          let name = "";
          while (!isWhiteSpace(input[i]) && input[i] !== ">") {
            name += input[i];
            i++;
          }

          if (!isValidName(name)) throw new Error("Invalid NOTATION name");

          i = whiteSpaceCleaner(input, i, true);

          const externalId = parseExternalId(input, i);
          if (!externalId) throw new Error("Malformed NOTATION");

          i = externalId.next;

          if (input[i] !== ">") {
            throw new Error(
              `Expected '>' after NOTATION declaration, got '${input[i]}'`
            );
          }

          declarations.push({
            type: "notation-declaration",
            name,
            externalId: externalId.value,
          });

          i++;
        } else {
          throw new Error("Invalid declaration name");
        }
      }
    } else {
      throw new Error(`Illegal character "${char}"`);
    }
  }

  i = whiteSpaceCleaner(input, i);

  if (input[i] !== ">") {
    throw new Error("Unclosed DOCTYPE declaration");
  }

  i++;

  return { next: i, doctype };
}
