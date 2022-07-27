import { rawXMLToAST, AST } from "./parser/mod.ts";
import {
  addDoctypeEntities,
  decodeEntities,
  EntitiesMap,
  newEntitiesMap,
} from "./parser/entities.ts";
import type * as XML from "./xml_types.ts";
import type { Except, Merge, Simplify } from "./type_fest.ts";

export type { XML };

export type ParseOptionsInput = Partial<ParseOptions>;

interface ParseOptions {
  compact: "loose" | "strict" | false;
  trim: "full" | "loose" | false;
  decodeEntities: boolean;
  parseValues: boolean;
  parseAttributes: boolean;
}

type WithDefault<T, D> = T extends undefined ? D : T;

interface CleanOptionsType<Options extends ParseOptionsInput> {
  compact: WithDefault<Options["compact"], false>;
  trim: WithDefault<Options["trim"], "loose">;
  decodeEntities: WithDefault<Options["decodeEntities"], true>;
  parseValues: WithDefault<Options["parseValues"], false>;
  parseAttributes: WithDefault<Options["parseAttributes"], false>;
}

function cleanOptions(
  options: ParseOptionsInput | undefined | null
): ParseOptions {
  return {
    compact: options?.compact ?? false,
    trim: options?.trim ?? "loose",
    decodeEntities: options?.decodeEntities ?? true,
    parseValues: options?.parseValues ?? false,
    parseAttributes: options?.parseAttributes ?? false,
  };
}

type CompactChildren<
  Child,
  CompactOption extends ParseOptions
> = CompactOption["compact"] extends "loose" ? Child | Child[] : Child[];

interface ParsedAttributes<Options extends ParseOptions> {
  [attr: string]: Options["parseAttributes"] extends true
    ? string | number | boolean | undefined
    : string | undefined;
}

interface CompactElements<Options extends ParseOptions> {
  [key: string]: CompactChildren<
    Merge<
      CompactElements<Options>,
      {
        _attributes?: ParsedAttributes<Options>;
        _comment?: CompactChildren<string, Options>;
        _instruction?: CompactChildren<
          Except<XML.Instruction, "type">,
          Options
        >;
        _text?: CompactChildren<string, Options>;
        _cdata?: CompactChildren<string, Options>;
      }
    >,
    Options
  >;
}

interface ParsedElement<Options extends ParseOptions> {
  type: "element";
  name: string;
  attributes: ParsedAttributes<Options>;
  children: (
    | (Options["parseValues"] extends true
        ? Merge<XML.Text, { value: string | number | boolean | null }>
        : XML.Text)
    | XML.Cdata
    | XML.Comment
    | Merge<XML.Instruction, { attributes: ParsedAttributes<Options> }>
    | ParsedElement<Options>
  )[];
}

type ParseResponse<Options extends ParseOptions> = Simplify<
  Options["compact"] extends false
    ? {
        declaration: XML.Declaration | null;
        root: (
          | XML.DocType
          | XML.Comment
          | Merge<XML.Instruction, { attributes: ParsedAttributes<Options> }>
          | ParsedElement<Options>
        )[];
      }
    : Merge<
        CompactElements<Options>,
        { _declaration?: XML.Declaration; _doctype?: XML.DocType }
      >
>;

/**
 * Parses an XML document into a AST.
 *
 * @param {string} input The XML document to parse.
 * @returns {ParseResult}
 */
export function parse<Options extends ParseOptionsInput = ParseOptionsInput>(
  input: string,
  opts?: Options
): ParseResponse<CleanOptionsType<Options>> {
  const options = cleanOptions(opts);
  const ast = rawXMLToAST(input);

  const entities = newEntitiesMap();

  const doctype = ast.root.find(
    (node) => node.type === "doctype"
  ) as XML.DocType | null;
  if (doctype) addDoctypeEntities(doctype, entities);

  visit(ast, (node) => {
    node.attributes = parseAttributes(node.attributes, entities, options);

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      if (child.type === "text") {
        if (options.trim) {
          const trimmed = child.value.trim();

          if (options.trim === "full") {
            child.value = trimmed;
          }

          if (trimmed.length === 0) {
            node.children.splice(i, 1);
            i--;
            continue;
          }
        }

        if (options.decodeEntities) {
          child.value = decodeEntities(child.value, entities);
        }

        if (options.parseValues) {
          if (child.value.length === 0) {
            // @ts-ignore - parseValues is true
            child.value = null;
          } else if (/^true$/i.test(child.value)) {
            // @ts-ignore - parseValues is true
            child.value = true;
          } else if (/^false$/i.test(child.value)) {
            // @ts-ignore - parseValues is true
            child.value = false;
          } else if (isFinite(parseFloat(child.value))) {
            // @ts-ignore - parseValues is true
            child.value = parseFloat(child.value);
          }
        }
      } else if (child.type === "instruction") {
        child.parsedAsAttributes = parseAttributes(
          child.parsedAsAttributes,
          entities,
          options
        );
      }
    }
  });

  if (options.compact === false) {
    // @ts-ignore - compact is false, this is correct
    return ast;
  }

  // deno-lint-ignore no-explicit-any
  const result: any = {};

  if (ast.declaration) result._declaration = ast.declaration;
  if (doctype) result._doctype = doctype;
  const firstElement = ast.root.find(
    (node) => node.type === "element"
  ) as XML.Element;

  result[firstElement.name] = compactify(firstElement, options);

  return result;
}

function parseAttributes(
  attributes: XML.Attributes,
  entities: EntitiesMap,
  options: ParseOptions
) {
  return Object.fromEntries(
    Object.entries(attributes).map((attribute) => {
      const key = attribute[0];
      // deno-lint-ignore no-explicit-any
      let value: any = attribute[1];

      if (options.decodeEntities) {
        value = decodeEntities(value, entities);
      }

      if (options.parseAttributes) {
        if (!value || value.length === 0) {
          return [key, null];
        } else if (/^true$/i.test(value)) {
          return [key, true];
        } else if (/^false$/i.test(value)) {
          return [key, false];
        } else if (isFinite(parseFloat(value))) {
          return [key, parseFloat(value)];
        }
      }

      return [key, value];
    })
  );
}

function visit(ast: AST, visitor: (node: XML.Element) => void) {
  // Find the root element (there should be none or one)
  for (const node of ast.root) {
    if (node.type === "element") {
      visitElement(node, visitor);
      break;
    }
  }
}

function visitElement(
  element: XML.Element,
  visitor: (node: XML.Element) => void
) {
  visitor(element);
  for (const node of element.children) {
    if (node.type === "element") visitElement(node, visitor);
  }
}

function compactify(element: XML.Element, options: ParseOptions) {
  // deno-lint-ignore no-explicit-any
  const result: any = {
    _cdata: [],
    _comment: [],
    _instruction: [],
    _text: [],
  };

  for (const child of element.children) {
    if (child.type === "cdata") {
      result._cdata.push(child.value);
    } else if (child.type === "comment") {
      result._comment.push(child.value);
    } else if (child.type === "text") {
      result._text.push(child.value);
    } else if (child.type === "instruction") {
      result._instruction.push({
        name: child.name,
        rawInstruction: child.rawInstruction,
        parsedAsAttributes: child.parsedAsAttributes,
      });
    } else {
      if (child.name in result) {
        result[child.name].push(compactify(child, options));
      } else {
        result[child.name] = [compactify(child, options)];
      }
    }
  }

  if (result._cdata.length === 0) delete result._cdata;
  if (result._comment.length === 0) delete result._comment;
  if (result._instruction.length === 0) delete result._instruction;
  if (result._text.length === 0) delete result._text;

  if (options.compact === "loose") {
    for (const key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        if (result[key].length === 1) {
          result[key] = result[key][0];
        }
      }
    }
  }

  if (Object.keys(element.attributes).length > 0) {
    result._attributes = { ...element.attributes };
  }

  return result;
}
