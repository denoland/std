import { Writer } from "deno";

const e = new TextEncoder();
const d = new TextDecoder();
export class StringWriter implements Writer {
  private chunks: Uint8Array[] = [];
  private byteLength: number = 0;

  constructor(private base: string = "") {
    const c = e.encode(base);
    this.chunks.push(c);
    this.byteLength += c.byteLength;
  }

  async write(p: Uint8Array): Promise<number> {
    this.chunks.push(p);
    this.byteLength += p.byteLength;
    this.cache = null;
    return p.byteLength;
  }

  private cache: string;

  toString(): string {
    if (this.cache) {
      return this.cache;
    }
    const buf = new Uint8Array(this.byteLength);
    let offs = 0;
    for (const chunk of this.chunks) {
      buf.set(chunk, offs);
      offs += chunk.byteLength;
    }
    this.cache = d.decode(buf);
    return this.cache;
  }
}
