export type Message = string | number[] | ArrayBuffer;

export interface Sha {
  update(message: Message): this;
  hex(): string;
  toString(): string;
  digest(): number[];
  array(): number[];
  arrayBuffer(): ArrayBuffer;
}
