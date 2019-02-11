export async function aggregateIterators<T>(
  it: AsyncIterableIterator<T>
): Promise<T[]> {
  const chunks = [];
  for await (const chunk of it) {
    chunks.push(chunk);
  }
  return chunks;
}
