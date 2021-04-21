export class PerfRecorder {
  #records = new Map<string, number>();
  #measures = new Map<string, number>();
  #counts = new Map<string, number>();
  private add(mark: string, t: number): void {
    const v = this.#records.get(mark) ?? 0;
    this.#records.set(mark, v + t);
  }
  private incr(mark: string) {
    const v = this.#counts.get(mark) ?? 0;
    this.#counts.set(mark, v + 1);
  }
  begin(mark: string) {
    this.#measures.set(mark, performance.now());
  }
  end(mark: string) {
    const now = performance.now();
    const begin = this.#measures.get(mark) ?? now;
    this.add(mark, now - begin);
    this.incr(mark);
  }
}
