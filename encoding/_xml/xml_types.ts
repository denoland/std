export interface Attributes {
  [attr: string]: string | undefined;
}

export type Node = Element | Text | Cdata | Comment | Instruction;

export interface Element {
  type: "element";
  name: string;
  attributes: Attributes;
  children: Node[];
}

export interface Text {
  type: "text";
  value: string;
}

export interface Cdata {
  type: "cdata";
  value: string;
}

export interface Comment {
  type: "comment";
  value: string;
}

export interface Instruction {
  type: "instruction";
  name: string;
  rawInstruction: string;
  parsedAsAttributes: Attributes;
}

export interface Declaration {
  version: "1.0" | "1.1";
  encoding?: string;
  standalone?: "yes" | "no";
}

export type Root = (Element | Comment | Instruction | DocType)[];

// Doctype specific

export interface DocType {
  type: "doctype";
  name: string;
  externalId?: ExternalId;
  declarations?: DoctypeDeclaration[];
}

export interface ElementDeclaration {
  type: "element-declaration";
  name: string;
  content: string;
}

export interface AttlistDeclaration {
  type: "attlist-declaration";
  name: string;
  definitions?: string;
}

export type EntityDeclaration = {
  type: "entity-declaration";
  name: string;
} & (
  | {
      entityType: "general-internal" | "parameter-internal";
      value: string;
    }
  | {
      entityType: "general-external";
      externalId: ExternalId;
      ndata?: string;
    }
  | {
      entityType: "parameter-external";
      externalId: ExternalId;
    }
);

export interface NotationDeclaration {
  type: "notation-declaration";
  name: string;
  externalId?: ExternalId<false>;
}

export interface Reference {
  type: "reference";
  name: string;
}

export type ExternalId<Strict = true> =
  | {
      type: "SYSTEM";
      systemId: string;
    }
  | ({
      type: "PUBLIC";
      publicId: string;
    } & (Strict extends true ? { systemId: string } : { systemId?: string }));

export type DoctypeDeclaration =
  | ElementDeclaration
  | AttlistDeclaration
  | EntityDeclaration
  | NotationDeclaration
  | Reference
  | Instruction
  | Comment;
