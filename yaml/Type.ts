import { ArrayObject } from "./utils.ts";

export type KindType = "sequence" | "scalar" | "mapping";
export type StyleVariant = "lowercase" | "uppercase" | "camelcase" | "decimal";
export type RepresentFn = (data: any, style?: StyleVariant) => any;

const DEFAULT_RESOLVE = () => true;
const DEFAULT_CONSTRUCT = (data: any) => data;

interface TypeOptions {
  kind: KindType;
  resolve?: (data: any) => boolean;
  construct?: (data: string) => any;
  instanceOf?: any;
  predicate?: (data: object) => boolean;
  represent?: RepresentFn | ArrayObject<RepresentFn>;
  defaultStyle?: StyleVariant;
  styleAliases?: { [x: string]: any };
}

function checkTagFormat(tag: string): string {
  return tag;
}

export class Type {
  public tag: string;
  public kind: KindType | null = null;
  public instanceOf: any;
  public predicate?: (data: object) => boolean;
  public represent?: RepresentFn | ArrayObject<RepresentFn>;
  public defaultStyle?: StyleVariant;
  public styleAliases?: { [x: string]: any };
  public loadKind?: KindType;

  constructor(tag: string, options?: TypeOptions) {
    this.tag = checkTagFormat(tag);
    if (options) {
      this.kind = options.kind;
      this.resolve = options.resolve || DEFAULT_RESOLVE;
      this.construct = options.construct || DEFAULT_CONSTRUCT;
      this.instanceOf = options.instanceOf;
      this.predicate = options.predicate;
      this.represent = options.represent;
      this.defaultStyle = options.defaultStyle;
      this.styleAliases = options.styleAliases;
    }
  }
  public resolve: (data?: any) => boolean = () => true;
  public construct: (data?: any) => any = data => data;
}
