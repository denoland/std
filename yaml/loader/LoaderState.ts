import { YAMLError } from "../error/YAMLError.ts";
import { Schema, SchemaDefinition, TypeMap } from "../Schema.ts";
import { State } from "../State.ts";
import { Type } from "../Type.ts";

export interface LoaderStateOptions {
  legacy?: boolean;
  listener?: () => any;
  /** string to be used as a file path in error/warning messages. */
  filename?: string;
  /** specifies a schema to use. */
  schema?: SchemaDefinition;
  /** compatibility with JSON.parse behaviour. */
  json?: boolean;
  /** function to call on warning messages. */
  onWarning?(this: null, e?: YAMLError): void;
}

export type ResultType = [] | {} | string;

export class LoaderState extends State {
  public documents = [];
  public length: number;
  public lineIndent = 0;
  public lineStart = 0;
  public position = 0;
  public line = 0;
  public filename?: string;
  public onWarning?: () => any;
  public legacy: boolean;
  public json: boolean;
  public listener?: (...args: any[]) => any;
  public implicitTypes: Type[];
  public typeMap: TypeMap;

  public version;
  public checkLineBreaks;
  public tagMap;
  public anchorMap;
  public tag;
  public anchor;
  public kind;
  public result: ResultType = "";

  constructor(
    public input: string,
    {
      filename,
      schema,
      onWarning,
      legacy = false,
      json = false,
      listener = null
    }: LoaderStateOptions
  ) {
    super(schema);
    this.filename = filename;
    this.onWarning = onWarning;
    this.legacy = legacy;
    this.json = json;
    this.listener = listener;

    this.implicitTypes = (this.schema as Schema).compiledImplicit;
    this.typeMap = (this.schema as Schema).compiledTypeMap;

    this.length = input.length;
  }
}
