export class Anything {
  equals(other: unknown): boolean {
    return other !== null && other !== undefined;
  }
}

export function anything(): Anything {
  return new Anything();
}
