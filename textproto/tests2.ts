interface ReadLineResult {
  line: Uint8Array;
  more: boolean;
}

class FakeBufReader {
  private lines: Array<Uint8Array | null>;
  private index: number;
  private last: number;

  constructor(lines: Array<Uint8Array | null>) {
    this.index = 0;
    this.last = lines.length - 1;
    this.lines = lines;
  }

  public readLine(): ReadLineResult | null {
    if (this.index > this.last) {
      return null;
    }

    const LINE: Uint8Array | null = this.lines[this.index];

    if (LINE === null) {
      ++this.index;
      return null;
    }

    const MORE: boolean = (this.index !== this.last);
    ++this.index;

    return {
      line: LINE,
      more: MORE,
    };
  }
}

class ParentTest {
  protected r: FakeBufReader;

  constructor(lines: Array<Uint8Array | null>) {
    this.r = new FakeBufReader(lines);
  }

  public skipSpace(l: Uint8Array): number {
    let n = 0;

    for (let i = 0; i < l.length; ++i) {
      if (l[i] === charCode(" ") || l[i] === charCode("\t")) {
        continue;
      }

      ++n;
    }

    return n;
  }
}

function charCode(s: string): number {
  return s.charCodeAt(0);
}

function concat(...args: Uint8Array[]): Uint8Array {
  const LENGTH: number = args.reduce(
    (length: number, item: Uint8Array) => {
      return length + item.length;
    },
    0,
  );

  const RESULT: Uint8Array = new Uint8Array(LENGTH);
  let offset: number = 0;

  args.forEach(
    (item: Uint8Array): void => {
      RESULT.set(item, offset);
      offset += item.length;
    },
  );

  return RESULT;
}

class ModifiedClass extends ParentTest {
  async readLineSlice(): Promise<Uint8Array | null> {
    let line: Uint8Array = new Uint8Array(0);
    let r: ReadLineResult | null = null;
    do {
      r = await this.r.readLine();
      if (r !== null && this.skipSpace(r.line) !== 0) {
        line = concat(line, r.line);
      }
    } while (r !== null && r.more);
    return r === null ? null : line;
  }
}

function convertStringsToUint8Arrays(
  items: Array<string | null>,
): Array<Uint8Array | null> {
  return items.map(
    (item: string | null): Uint8Array | null => {
      if (item === null) {
        return null;
      }

      const LENGTH: number = item.length;
      const RESULT: Uint8Array = new Uint8Array(LENGTH);

      for (let i: number = 0; i < LENGTH; ++i) {
        RESULT[i] = item.charCodeAt(i);
      }

      return RESULT;
    },
  );
}

(async () => {
  try {
    const TESTS: Array<Array<Uint8Array | null>> = [
      /* 1 */ [],
      /* 2 */ [
        new Uint8Array(0),
      ],
      /* 3 */ [
        new Uint8Array(0),
        new Uint8Array(0),
        new Uint8Array(0),
        new Uint8Array(0),
        new Uint8Array(0),
      ],
      /* 4 */ convertStringsToUint8Arrays([
        "Hello, World!",
      ]),
      /* 5 */ convertStringsToUint8Arrays([
        "Hello, World!\n",
      ]),
      /* 6 */ convertStringsToUint8Arrays([
        "Hello,\0 World!",
      ]),
      /* 7 */ convertStringsToUint8Arrays([
        "Hello,\n World!",
      ]),
      /* 8 */ convertStringsToUint8Arrays([
        "\nHello, World!",
      ]),
      /* 9 */ convertStringsToUint8Arrays([
        "Hello, World! ",
        "Hello, World! ",
        "Hello, World! ",
      ]),
      /* 10 */ convertStringsToUint8Arrays([
        "Hello, World! ",
        "Hello, World! ",
        "Hello, World!\n",
      ]),
      /* 11 */ convertStringsToUint8Arrays([
        "   \t   ",
      ]),
      /* 12 */ convertStringsToUint8Arrays([
        "   \t   \n",
      ]),
      /* 13 */ convertStringsToUint8Arrays([
        "   \n   \t",
      ]),
      /* 14 */ convertStringsToUint8Arrays([
        "\n   ",
      ]),
      /* 15 */ convertStringsToUint8Arrays([
        "Hello, World! \n",
        "Hello, World! ",
        "Hello, World!\n",
      ]),
      /* 16 */ convertStringsToUint8Arrays([
        "Hello, World! ",
        null,
        "Hello, World!\n",
      ]),
    ];

    let index: number = 0;
    for (let initializer of TESTS) {
      ++index;
      const ORIGINAL: OriginalClass = new OriginalClass(initializer);
      const MODIFIED: ModifiedClass = new ModifiedClass(initializer);

      const ORIGINAL_RESULT: Uint8Array | null = await ORIGINAL.readLineSlice();
      const MODIFIED_RESULT: Uint8Array | null = await MODIFIED.readLineSlice();

      console.log(`Test: ${index}`, MODIFIED_RESULT);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
    }
  }
})();
