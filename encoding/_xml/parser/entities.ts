import type * as XML from "../xml_types.ts";

export type EntitiesMap = Map<string, { regex: RegExp; value: string }>;

export function newEntitiesMap(): EntitiesMap {
  return new Map([
    // Standard XML entities
    ["amp", { regex: /&(amp|#38|#x26);/g, value: "&" }],
    ["apos", { regex: /&(apos|#39|#x27);/g, value: "'" }],
    ["gt", { regex: /&(gt|#62|#x3E);/g, value: ">" }],
    ["lt", { regex: /&(lt|#60|#x3C);/g, value: "<" }],
    ["quot", { regex: /&(quot|#34|#x22);/g, value: '"' }],
  ]);
}

export function decodeEntities(text: string, entities: EntitiesMap) {
  for (const entity of entities.values()) {
    text = text.replace(entity.regex, entity.value);
  }

  return text;
}

export function addDoctypeEntities(
  doctype: XML.DocType,
  entities: EntitiesMap
) {
  if (!doctype.declarations) return;

  for (const declaration of doctype.declarations) {
    if (
      declaration.type === "entity-declaration" &&
      declaration.entityType === "general-internal"
    ) {
      entities.set(declaration.name, {
        regex: new RegExp(`&${declaration.name};`, "g"),
        value: declaration.value,
      });
    }
  }
}
