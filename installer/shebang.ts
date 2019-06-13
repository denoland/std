export interface Shebang {
  path: string;
  args: string[];
}

class ShebangImpl implements Shebang {
  public readonly path: string;
  public readonly args: string[];

  constructor(shebang: string) {
    const line = shebang.split("\n")[0];
    const parts = line.split(" ").map((s: string): string => s.trim());
    const pathBase = parts.shift();

    if (!pathBase.startsWith("#!")) {
      throw new Error("Not a shebang.");
    }

    this.path = pathBase.slice(2);
    this.args = [...parts];
  }

  toString(): string {
    return [`#!${this.path}`, ...this.args].join(" ");
  }
}

export function parse(shebang: string): Shebang {
  return new ShebangImpl(shebang);
}
