export function set_arguments<T, P1>(fn: (p1: P1) => T, p1: P1): () => T;
export function set_arguments<T, P1, P2>(
  fn: (p1: P1, p2: P2) => T,
  p1: P1,
  p2: undefined,
): (p2: P2) => T;
export function set_arguments<T, P1, P2>(
  fn: (p1: P1, p2: P2) => T,
  p1: undefined,
  p2: P2,
): (p1: P1) => T;
export function set_arguments<T, P1, P2>(
  fn: (p1: P1, p2: P2) => T,
  p1: P1,
  p2: P2,
): () => T;
export function set_arguments<T, P1, P2, P3>(
  fn: (p1: P1, p2: P2, p3: P3) => T,
  p1: P1,
  p2: P2,
  p3: undefined,
): (p3: P3) => T;
export function set_arguments<T, P1, P2, P3>(
  fn: (p1: P1, p2: P2, p3: P3) => T,
  p1: P1,
  p2: undefined,
  p3: P3,
): (p2: P2) => T;
export function set_arguments<T, P1, P2, P3>(
  fn: (p1: P1, p2: P2, p3: P3) => T,
  p1: undefined,
  p2: P2,
  p3: P3,
): (p1: P1) => T;
export function set_arguments<T, P1, P2, P3>(
  fn: (p1: P1, p2: P2, p3: P3) => T,
  p1: P1,
  p2: undefined,
  p3: undefined,
): (p2: P2, p3: P3) => T;
export function set_arguments<T, P1, P2, P3>(
  fn: (p1: P1, p2: P2, p3: P3) => T,
  p1: undefined,
  p2: P2,
  p3: undefined,
): (p1: P1, p3: P3) => T;
export function set_arguments<T, P1, P2, P3>(
  fn: (p1: P1, p2: P2, p3: P3) => T,
  p1: undefined,
  p2: undefined,
  p3: P3,
): (p1: P1, p2: P2) => T;
export function set_arguments<T, P1, P2, P3>(
  fn: (p1: P1, p2: P2, p3: P3) => T,
  p1: P1,
  p2: P2,
  p3: P3,
): () => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: P1,
  p2: P2,
  p3: P3,
  p4: undefined,
): (p4: P4) => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: P1,
  p2: P2,
  p3: undefined,
  p4: P4,
): (p3: P3) => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: P1,
  p2: undefined,
  p3: P3,
  p4: P4,
): (p2: P2) => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: undefined,
  p2: P2,
  p3: P3,
  p4: P4,
): (p1: P1) => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: P1,
  p2: P2,
  p3: undefined,
  p4: undefined,
): (p3: P3, p4: P4) => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: P1,
  p2: undefined,
  p3: P3,
  p4: undefined,
): (p2: P2, p4: P4) => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: undefined,
  p2: P2,
  p3: undefined,
  p4: P4,
): (p1: P1, p3: P3) => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: undefined,
  p2: undefined,
  p3: P3,
  p4: P4,
): (p1: P1, p2: P2) => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: undefined,
  p2: P2,
  p3: P3,
  p4: undefined,
): (p1: P1, p4: P4) => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: P1,
  p2: undefined,
  p3: undefined,
  p4: P4,
): (p2: P2, p3: P3) => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: undefined,
  p2: undefined,
  p3: undefined,
  p4: P4,
): (p1: P1, p2: P2, p3: P3) => T;
export function set_arguments<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
  p1: P1,
  p2: P2,
  p3: P3,
  p4: P4,
): () => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: P1,
  p2: P2,
  p3: P3,
  p4: P4,
  p5: undefined,
): (p5: P5) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: P1,
  p2: P2,
  p3: P3,
  p4: undefined,
  p5: P5,
): (p4: P4) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: P1,
  p2: P2,
  p3: undefined,
  p4: P4,
  p5: P5,
): (p3: P3) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: P1,
  p2: undefined,
  p3: P3,
  p4: P4,
  p5: P5,
): (p2: P2) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: undefined,
  p2: P2,
  p3: P3,
  p4: P4,
  p5: P5,
): (p1: P1) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: P1,
  p2: P2,
  p3: P3,
  p4: undefined,
  p5: undefined,
): (p4: P4, p5: P5) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: P1,
  p2: P2,
  p3: undefined,
  p4: P4,
  p5: undefined,
): (p3: P3, p5: P5) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: P1,
  p2: undefined,
  p3: P3,
  p4: undefined,
  p5: P5,
): (p2: P2, p4: P4) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: undefined,
  p2: P2,
  p3: P3,
  p4: undefined,
  p5: P5,
): (p1: P1, p4: P4) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: P1,
  p2: undefined,
  p3: undefined,
  p4: P4,
  p5: P5,
): (p2: P2, p3: P3) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: undefined,
  p2: P2,
  p3: undefined,
  p4: P4,
  p5: P5,
): (p1: P1, p3: P3) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: undefined,
  p2: undefined,
  p3: P3,
  p4: P4,
  p5: P5,
): (p1: P1, p2: P2) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: undefined,
  p2: P2,
  p3: P3,
  p4: P4,
  p5: undefined,
): (p1: P1, p5: P5) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: P1,
  p2: undefined,
  p3: undefined,
  p4: P4,
  p5: undefined,
): (p2: P2, p3: P3, p5: P5) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: undefined,
  p2: undefined,
  p3: P3,
  p4: P4,
  p5: undefined,
): (p1: P1, p2: P2, p5: P5) => T;
export function set_arguments<T, P1, P2, P3, P4, P5>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => T,
  p1: P1,
  p2: P2,
  p3: P3,
  p4: P4,
  p5: P5,
): () => T;
export function set_arguments(
  fn: (...args: any[]) => any,
  ...setArgs: any[]
) {
  // ensure setArgs at least as long as the function's arguments
  while (setArgs.length < fn.length) {
    setArgs.push(undefined);
  }

  return (...providedArgs: any[]) => {
    // insert each argument at the index of undefined
    const mergedArgs = setArgs.map((arg) =>
      arg === undefined ? providedArgs.shift() : arg
    );

    return fn(...mergedArgs);
  };
}

if (import.meta.main) {
  const divide = (a: number, b: number) => a / b;
  const invert = set_arguments(divide, 1, undefined);
  const r = invert(2);
  console.log(r); // 1/2
}
