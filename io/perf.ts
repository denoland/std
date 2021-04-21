export class PerfRecorder {
  records = new Map<string, number>();
  measures = new Map<string, number>();
  counts = new Map<string, number>();
  private add(mark: string, t: number): void {
    const v = this.records.get(mark) ?? 0;
    this.records.set(mark, v + t);
  }
  private incr(mark: string) {
    const v = this.counts.get(mark) ?? 0;
    this.counts.set(mark, v + 1);
  }
  begin(mark: string) {
    this.measures.set(mark, performance.now());
  }
  end(mark: string) {
    const now = performance.now();
    const begin = this.measures.get(mark) ?? now;
    this.add(mark, now - begin);
    this.incr(mark);
  }
}

/**
 * An abstraction of multiple Uint8Arrays
 */
export class BytesList {
  private len = 0;
  size() {
    return this.len;
  }
  private chunks: {
    value: Uint8Array;
    start: number; // start offset from head of chunk
    end: number; // end offset from head of chunk
    offset: number; // offset of head in all bytes
  }[] = [];
  constructor() {}
  add(value: Uint8Array, start: number = 0, end: number = value.byteLength) {
    if (value.byteLength === 0 || end === 0) {
      return;
    }
    this.chunks.push({
      value,
      end,
      start,
      offset: this.len,
    });
    this.len += end - start;
  }
  /**
   * Drop head bytes before pos
   */
  shift(pos: number) {
    const idx = this.getChunkIndex(pos);
    if (idx < 0) {
      this.chunks = [];
      this.len = 0;
      return;
    }
    this.chunks.splice(0, idx);
    const [chunk] = this.chunks;
    if (chunk) {
      const diff = pos - chunk.offset;
      chunk.start += diff;
    }
    let offset = 0;
    for (const chunk of this.chunks) {
      chunk.offset = offset;
      offset += chunk.end - chunk.start;
    }
    this.len = offset;
  }
  /**
   * Find chunk index that pos contained by binary-search
   * returns -1 if out of range
   */
  getChunkIndex(pos: number): number {
    let max = this.chunks.length;
    let min = 0;
    while (true) {
      const i = min + Math.floor((max - min) / 2);
      if (i < 0 || this.chunks.length <= i) {
        return -1;
      }
      const { offset, start, end } = this.chunks[i];
      const len = end - start;
      if (offset <= pos && pos < offset + len) {
        return i;
      } else if (offset + len <= pos) {
        min = i + 1;
      } else {
        max = i - 1;
      }
    }
  }

  /**
   * Get indexed byte from chunks O(logN)
   */
  get(i: number) {
    const idx = this.getChunkIndex(i);
    if (idx < 0) {
      throw new Error("out of range");
    }
    const { value, offset, start } = this.chunks[idx];
    return value[start + i - offset];
  }
  /**
   *
   */
  slice(start: number, end: number = this.len): Uint8Array {
    const result = new Uint8Array(end - start);
    if (end === start) {
      return new Uint8Array();
    }
    if (start < 0) {
      start += this.len;
    }
    if (end < 0) {
      end += this.len;
    }
    if (start < 0) {
      start = 0;
    }
    if (this.len <= end) {
      end = this.len;
    }
    const startIdx = this.getChunkIndex(start);
    const endIdx = this.getChunkIndex(end - 1);
    if (startIdx < 0 || endIdx < 0) {
      throw new Error("out of range");
    }
    let written = 0;
    for (let i = startIdx; i < endIdx; i++) {
      const chunk = this.chunks[i];
      const len = chunk.end - chunk.start;
      result.set(chunk.value.subarray(chunk.start, chunk.end), written);
      written += len;
    }
    const last = this.chunks[endIdx];
    const rest = end - start - written;
    result.set(last.value.subarray(last.start, last.start + rest), written);
    return result;
  }
  /**
   * Concatenate chunks into single Uint8Array copied.
   */
  concat() {
    const result = new Uint8Array(this.len);
    let sum = 0;
    for (const { value, start, end } of this.chunks) {
      result.set(value.subarray(start, end), sum);
      sum += end - start;
    }
    return result;
  }
}
