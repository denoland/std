import { Mark } from "./mark.ts";

const { DenoError, ErrorKind } = Deno;

export class YAMLError extends DenoError<typeof ErrorKind.Other> {
  constructor(
    message = "(unknown reason)",
    protected mark: Mark | string = ""
  ) {
    super(ErrorKind.Other, `${message} ${mark}`);
    this.name = this.constructor.name;
  }

  public toString(_compact: boolean): string {
    return `${this.name}: ${this.message} ${this.mark}`;
  }
}
