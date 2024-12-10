// deno-lint-ignore-file no-explicit-any
type AnyFunc = (...arg: any) => any;

type LastFnReturnType<F extends Array<AnyFunc>, Else = never> = F extends [
  ...any[],
  (...arg: any) => infer R,
] ? R
  : Else;

// inspired by https://dev.to/ecyrbe/how-to-use-advanced-typescript-to-define-a-pipe-function-381h
type PipeArgs<F extends AnyFunc[], Acc extends AnyFunc[] = []> = F extends [
  (...args: infer A) => infer B,
] ? [...Acc, (...args: A) => B]
  : F extends [(...args: infer A) => any, ...infer Tail]
    ? Tail extends [(arg: infer B) => any, ...any[]]
      ? PipeArgs<Tail, [...Acc, (...args: A) => B]>
    : Acc
  : Acc;

export function pipe<FirstFn extends AnyFunc, F extends AnyFunc[]>(
  firstFn: FirstFn,
  ...fns: PipeArgs<F> extends F ? F : PipeArgs<F>
): (arg: Parameters<FirstFn>[0]) => LastFnReturnType<F, ReturnType<FirstFn>> {
  return (arg: Parameters<FirstFn>[0]) =>
    (fns as AnyFunc[]).reduce((acc, fn) => fn(acc), firstFn(arg));
}

if (import.meta.main) {
  const res = pipe(Math.abs, Math.sqrt, Math.floor);
  res(-2); // 1
}
