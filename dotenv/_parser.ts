export class Parser {
  protected input: string;
  protected index: number;
  constructor() {
    this.input = "";
    this.index = 0;
  }

  protected peekChar() {
    return this.input[this.index];
  }
  protected nextChar() {
    const value = this.peekChar();
    this.index += 1;
    return value;
  }
  protected parseChar(char: string) {
    const result = this.peekChar() === char;
    if (result) this.nextChar();
    return result;
  }

  protected peekString(length: number) {
    return this.input.slice(this.index, this.index + length);
  }
  protected nextString(length: number) {
    const value = this.peekString(length);
    this.index += length;
    return value;
  }
  protected parseString(string: string) {
    const result = this.startsWith(string);
    if (result) this.nextString(string.length);
    return result;
  }

  protected isEOF() {
    return this.index >= this.input.length;
  }
  protected indexOf(searchString: string, position = this.index) {
    return this.input.indexOf(searchString, position);
  }
  protected startsWith(searchString: string, position = this.index) {
    return this.input.startsWith(searchString, position);
  }
}
