import {Buffer, Closer, open, Reader} from "deno";

export type FileHeader = {
  filename: string;
  headers: Headers;
  size?: number;
  content?: Uint8Array;
  tempfile?: string;
};

export class FormFile implements domTypes.DomFile {
  readonly lastModified: number;

  constructor(private header: FileHeader) {
    this.lastModified = Date.now();
  }

  async open(): Promise<Reader & Closer> {
    if (this.header.content) {
      const r = new Buffer(this.header.content);
      return {
        read: p => r.read(p),
        close: () => {
        }
      }
    } else if (this.header.tempfile) {
      return await open(this.header.tempfile);
    }
  }

  get name(): string {
    return this.header.filename;
  }

  get size(): number | null {
    if (Number.isInteger(this.header.size)) {
      return this.header.size
    }
    if (this.header.content) {
      return this.header.size = this.header.content.byteLength
    }
    return null;
  }

  get type(): string {
    return this.header.headers.get("content-type");
  }

  slice(start?: number, end?: number, contentType?: string): domTypes.Blob {
    return undefined;
  }
}
