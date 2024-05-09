export type DiffType = "removed" | "common" | "added";

export interface DiffResult<T> {
  type: DiffType;
  value: T;
  details?: Array<DiffResult<T>>;
}
