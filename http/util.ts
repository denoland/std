// Sleeps the given milliseconds and resolves.
export function sleep(ms: number): Promise<void> {
  return new Promise(
    (res): number =>
      setTimeout((): void => {
        res();
      }, ms)
  );
}
