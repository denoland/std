import { Mark } from "../Mark.ts";

const { DenoError, ErrorKind } = Deno;

export class YAMLError extends DenoError<typeof ErrorKind.Other> {
  constructor(
    message = "(unknown reason)",
    protected mark: Mark | string = ""
  ) {
    super(ErrorKind.Other, `${message} ${mark}`);
    this.name = this.constructor.name;
  }

  public toString(compact: boolean) {
    return `${this.name}: ${this.message} ${this.mark}`;
  }
}
