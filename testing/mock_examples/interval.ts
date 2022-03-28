export function secondInterval(cb: () => void): number {
  return setInterval(cb, 1000);
}
