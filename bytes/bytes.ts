export function bytesFindIndex(a: Uint8Array, pat: Uint8Array): number {
  const s = pat[0];
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== s) continue;
    let pin = i;
    let matched = 1;
    while (matched < pat.length) {
      i++;
      if (a[i] !== pat[i - pin]) {
        break;
      }
      matched++;
    }
    if (matched === pat.length) {
      return pin;
    }
  }
  return -1;
}

export function bytesFindLastIndex(a: Uint8Array, pat: Uint8Array) {
  const e = pat[pat.length - 1];
  for (let i = a.length - 1; i >= 0; i--) {
    if (a[i] !== e) continue;
    let pin = i;
    let matched = 1;
    while (matched < pat.length) {
      i--;
      if (a[i] !== pat[pat.length - 1 - (pin - i)]) {
        break;
      }
      matched++;
    }
    if (matched === pat.length) {
      return pin - pat.length + 1;
    }
  }
  return -1;
}

export function bytesEqual(a: Uint8Array, match: Uint8Array): boolean {
  if (a.length !== match.length) return false;
  for (let i = 0; i < match.length; i++) {
    if (a[i] !== match[i]) return false;
  }
  return true;
}

export function bytesHasPrefix(a: Uint8Array, prefix: Uint8Array): boolean {
  for (let i = 0, max = prefix.length; i < max; i++) {
    if (a[i] !== prefix[i]) return false;
  }
  return true;
}
